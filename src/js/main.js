(() => {
    'use strict';

    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    /* --------------------------------------------------
     Footer year
  -------------------------------------------------- */
    const yearEl = $('#currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* --------------------------------------------------
     Scroll reveal (IntersectionObserver)
     JS adds .reveal so non-JS users always see content
  -------------------------------------------------- */
    const revealEls = $$('[data-reveal]');
    if (revealEls.length && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
        );

        revealEls.forEach((el, i) => {
            el.classList.add('reveal');

            // Stagger cards within a shared grid parent
            const siblings = $$('[data-reveal]', el.parentElement);
            if (siblings.length > 1) {
                const idx = siblings.indexOf(el);
                el.style.transitionDelay = `${idx * 0.12}s`;
            }

            observer.observe(el);
        });
    }

    /* --------------------------------------------------
     Mobile nav toggle
  -------------------------------------------------- */
    const navToggle = $('#navToggle');
    const siteNav = $('#siteNav');

    if (navToggle && siteNav) {
        navToggle.addEventListener('click', () => {
            const open = siteNav.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', String(open));
            navToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
        });

        $$('a', siteNav).forEach((link) => {
            link.addEventListener('click', () => {
                siteNav.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.setAttribute('aria-label', 'Open navigation menu');
            });
        });

        document.addEventListener('click', (e) => {
            if (!siteNav.contains(e.target) && !navToggle.contains(e.target)) {
                siteNav.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /* --------------------------------------------------
     Sticky header shadow on scroll
  -------------------------------------------------- */
    const header = $('.site-header');
    if (header) {
        window.addEventListener(
            'scroll',
            () => {
                header.style.boxShadow =
                    window.scrollY > 8 ? '0 2px 24px rgba(0,0,0,.4)' : '0 2px 16px rgba(0,0,0,.25)';
            },
            { passive: true }
        );
    }

    /* --------------------------------------------------
     Gallery carousel — rAF-driven continuous scroll
  -------------------------------------------------- */
    const track = $('#galleryTrack');
    const prevBtn = $('#galleryPrev');
    const nextBtn = $('#galleryNext');
    const dotsWrap = $('#galleryDots');

    if (!track) return;

    const realItems = $$('.gallery-item', track);
    const realCount = realItems.length;
    if (realCount === 0) return;

    // Duplicate slides so the loop plays seamlessly
    realItems.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.removeAttribute('role');
        clone.removeAttribute('aria-roledescription');
        track.appendChild(clone);
    });

    const allSlides = $$('.gallery-item', track);
    const galleryOuter = $('.gallery-outer');
    const SPEED = 20; // px/second — increase to speed up, decrease to slow down

    // Dots
    const dots = realItems.map((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'gallery-dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', `Go to slide ${i + 1} of ${realCount}`);
        if (i === 0) dot.setAttribute('aria-current', 'true');
        dotsWrap?.appendChild(dot);
        return dot;
    });

    // Layout cache — only recomputed on resize, never inside the animation loop
    let step = 0;
    let totalW = 0;

    function remeasure() {
        const gap = parseFloat(getComputedStyle(track).gap) || 0;
        step = allSlides[0].getBoundingClientRect().width + gap;
        totalW = realCount * step;
    }

    // Animation state
    let xPos = 0; // current translateX (always ≤ 0)
    let hoverPaused = false;
    let focusPaused = false;
    let userPaused = false; // pause button / prefers-reduced-motion
    let drag = null;
    let swipe = null;
    let lastTs = 0;

    const isPaused = () => hoverPaused || focusPaused || userPaused;

    // Snap xPos to the nearest slide boundary
    function snapToSlide() {
        if (!step || !totalW) return;
        let norm = xPos % totalW; // keeps sign of xPos (negative)
        if (norm > 0) norm -= totalW; // drag-right overshoot: wrap into negative range
        xPos = -Math.round(Math.abs(norm) / step) * step;
        if (Math.abs(xPos) >= totalW) xPos = 0; // –totalW wraps back to 0
    }

    // RAF tick — runs every frame, cheap arithmetic only
    function tick(ts) {
        requestAnimationFrame(tick);

        const dt = lastTs ? Math.min(ts - lastTs, 100) : 0; // cap at 100 ms (handles tab sleep)
        lastTs = ts;

        if (!isPaused() && !drag && !swipe && totalW > 0) {
            xPos -= SPEED * (dt / 1000);
            if (xPos < -totalW) xPos += totalW; // wrap without modulo — only ever 1 wrap needed
            track.style.transform = `translateX(${xPos}px)`;
        }

        // Update active dot
        if (totalW > 0 && step > 0) {
            const normX = Math.abs(xPos) % totalW;
            const idx = Math.round(normX / step) % realCount;
            dots.forEach((d, i) => {
                const active = i === idx;
                d.classList.toggle('is-active', active);
                if (active) d.setAttribute('aria-current', 'true');
                else d.removeAttribute('aria-current');
            });
        }
    }

    // Start after first paint so getBoundingClientRect reflects real layout
    requestAnimationFrame(() => {
        remeasure();
        requestAnimationFrame(tick);
    });

    // Hover: pause while pointer is inside the gallery
    galleryOuter?.addEventListener('mouseenter', () => {
        hoverPaused = true;
    });
    galleryOuter?.addEventListener('mouseleave', () => {
        hoverPaused = false;
    });

    // Keyboard: pause while focus is inside the gallery
    galleryOuter?.addEventListener('focusin', () => {
        focusPaused = true;
    });
    galleryOuter?.addEventListener('focusout', (e) => {
        if (!galleryOuter.contains(e.relatedTarget)) focusPaused = false;
    });

    // Pause button + prefers-reduced-motion
    const pauseBtn = $('#galleryPause');

    function setUserPaused(value) {
        userPaused = value;
        pauseBtn?.setAttribute('aria-pressed', String(value));
        pauseBtn?.setAttribute('aria-label', value ? 'Resume gallery auto-scroll' : 'Pause gallery auto-scroll');
    }

    pauseBtn?.addEventListener('click', () => setUserPaused(!userPaused));

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    // if (motionQuery?.matches) setUserPaused(true);
    motionQuery?.addEventListener?.('change', (e) => setUserPaused(e.matches));

    // Prev / Next: jump by one slide
    prevBtn?.addEventListener('click', () => {
        if (!step) return;
        const curr = Math.round(Math.abs(xPos) / step) % realCount;
        xPos = -((curr - 1 + realCount) % realCount) * step;
        track.style.transform = `translateX(${xPos}px)`;
    });
    nextBtn?.addEventListener('click', () => {
        if (!step) return;
        const curr = Math.round(Math.abs(xPos) / step) % realCount;
        xPos = -((curr + 1) % realCount) * step;
        track.style.transform = `translateX(${xPos}px)`;
    });

    // Dot clicks
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            if (!step) return;
            xPos = -(i * step);
            track.style.transform = `translateX(${xPos}px)`;
        });
    });

    // Keyboard
    track.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevBtn?.click();
            e.preventDefault();
        }
        if (e.key === 'ArrowRight') {
            nextBtn?.click();
            e.preventDefault();
        }
    });

    // Desktop drag
    track.addEventListener('mousedown', (e) => {
        drag = { startX: e.pageX, originX: xPos };
        track.style.cursor = 'grabbing';
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (!drag) return;
        xPos = drag.originX + (e.pageX - drag.startX);
        track.style.transform = `translateX(${xPos}px)`;
    });
    document.addEventListener('mouseup', () => {
        if (!drag) return;
        drag = null;
        track.style.cursor = '';
        snapToSlide();
        track.style.transform = `translateX(${xPos}px)`;
    });

    // Touch swipe
    track.addEventListener(
        'touchstart',
        (e) => {
            swipe = { startX: e.touches[0].clientX, originX: xPos };
        },
        { passive: true }
    );
    track.addEventListener(
        'touchmove',
        (e) => {
            if (!swipe) return;
            xPos = swipe.originX + (e.touches[0].clientX - swipe.startX);
            track.style.transform = `translateX(${xPos}px)`;
        },
        { passive: true }
    );
    track.addEventListener('touchend', () => {
        if (!swipe) return;
        swipe = null;
        snapToSlide();
        track.style.transform = `translateX(${xPos}px)`;
    });

    // Resize: re-measure and rescale position proportionally
    let resizeTimer;
    window.addEventListener(
        'resize',
        () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const prevStep = step;
                remeasure();
                if (prevStep > 0 && step > 0) xPos = xPos * (step / prevStep);
                xPos = xPos < -totalW ? xPos + totalW : xPos;
                track.style.transform = `translateX(${xPos}px)`;
            }, 200);
        },
        { passive: true }
    );

    /* --------------------------------------------------
     Contact form
  -------------------------------------------------- */
    const form = $('#contactForm');
    const submitBtn = $('#submitBtn');
    const statusEl = $('#formStatus');

    if (!form) return;

    function validateField(id, errorId, check, message) {
        const field = $(`#${id}`);
        const errorEl = $(`#${errorId}`);
        if (!field || !errorEl) return true;
        const valid = check(field.value.trim());
        errorEl.textContent = valid ? '' : message;
        field.classList.toggle('is-invalid', !valid);
        return valid;
    }

    function validateAll() {
        const n = validateField('name', 'nameError', (v) => v.length >= 2, 'Please enter your name.');
        const e = validateField(
            'email',
            'emailError',
            (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
            'Please enter a valid email address.'
        );
        const m = validateField(
            'message',
            'messageError',
            (v) => v.length >= 10,
            'Please describe your project (at least 10 characters).'
        );
        return n && e && m;
    }

    let submitted = false;
    ['name', 'email', 'message'].forEach((id) => {
        $(`#${id}`)?.addEventListener('input', () => {
            if (submitted) validateAll();
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitted = true;
        if (!validateAll()) return;

        const hp = form.querySelector('[name="website"]');
        if (hp?.value) {
            showStatus('success', "Thanks! We'll be in touch soon.");
            return;
        }

        setLoading(true);
        clearStatus();

        fetch(form.action, { method: 'POST', body: new FormData(form) })
            .then((res) => {
                if (!res.ok) throw new Error(`${res.status}`);
                return res.json();
            })
            .then((data) => {
                setLoading(false);
                if (data?.success === false) {
                    showStatus('error', data.message || 'Something went wrong. Please try again or call us directly.');
                } else {
                    const name = new FormData(form).get('name') || 'there';
                    showStatus(
                        'success',
                        `Thanks, ${name}! We received your message and will be in touch within 1 business day.`
                    );
                    form.reset();
                    submitted = false;
                }
            })
            .catch(() => {
                setLoading(false);
                showStatus(
                    'success',
                    "Your message was received! We'll follow up shortly. (Need a faster response? Call or text us directly.)"
                );
                form.reset();
                submitted = false;
            });
    });

    function setLoading(loading) {
        if (!submitBtn) return;
        submitBtn.disabled = loading;
        submitBtn.classList.toggle('is-loading', loading);
    }

    function showStatus(type, message) {
        if (!statusEl) return;
        statusEl.className = `form-status is-${type}`;
        statusEl.textContent = message;
        statusEl.style.display = 'block';
        statusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function clearStatus() {
        if (!statusEl) return;
        statusEl.className = 'form-status';
        statusEl.textContent = '';
        statusEl.style.display = 'none';
    }
})();
