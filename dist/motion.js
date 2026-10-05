// Shared glyphs travel from the hero to the header, like a matched layer transition.
export function initScrollMotion() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let teardown = () => {};
  const setup = () => {
    teardown();
    if (reduced.matches) return;
    const hero = document.getElementById('heroTitle');
    const name = document.getElementById('brandName');
    if (!hero || !name) return;
    const heroHTML = hero.innerHTML, nameText = name.textContent;
    const brandSub = document.querySelector('.brand-sub');
    const heroCompanions = [...document.querySelectorAll('.hero .eyebrow,.hero-intro,.hero .actions,.draft-note')];
    const sourceLines = [...hero.childNodes].reduce((lines, node) => {
      if (node.nodeName === 'BR') lines.push(''); else lines[lines.length - 1] += node.textContent;
      return lines;
    }, ['']);
    // Enable a shared text transition only when these are the same person's name.
    const identityMatches = sourceLines.join('').replace(/[\s.]/g, '') === nameText.replace(/\s/g, '');
    let overlay, glyphs = [], bounds = [], startY = 0, endY = 1;
    const sourceSpans = [], targetSpans = [];
    if (identityMatches) {
      hero.setAttribute('aria-label', sourceLines.join(' '));
      hero.replaceChildren(); name.replaceChildren();
      sourceLines.forEach((line, index) => {
        if (index) hero.append(document.createElement('br'));
        for (const char of line) {
          const span = document.createElement('span'); span.className = 'motion-glyph-source'; span.textContent = char === ' ' ? '\u00a0' : char; span.setAttribute('aria-hidden','true'); hero.append(span);
          if (char.trim()) sourceSpans.push(span);
        }
      });
      for (const char of nameText) {
        const span = document.createElement('span'); span.textContent = char === ' ' ? '\u00a0' : char; span.setAttribute('aria-hidden','true'); name.append(span);
        if (char.trim()) targetSpans.push(span);
      }
      name.setAttribute('aria-label',nameText);
      overlay = document.createElement('div'); overlay.className = 'matched-text-layer'; overlay.setAttribute('aria-hidden','true');
      sourceSpans.forEach(span => { const glyph = document.createElement('span'); glyph.textContent = span.textContent; overlay.append(glyph); glyphs.push(glyph); });
      document.body.append(overlay);
    }
    const layers = [...document.querySelectorAll('.field-copy,.section-heading,.about-grid > div:last-child,.visual,.portrait,.project-visual,.contact h2')];
    layers.forEach(node => { node.classList.add('scroll-layer'); node.style.setProperty('--reveal', '1'); });
    let frame = 0, disposed = false;
    const clamp = n => Math.max(0,Math.min(1,n));
    const ease = n => n*n*(3-2*n);
    function measure() {
      if (disposed) return;
      const scroll = window.scrollY;
      const style = getComputedStyle(hero);
      const targetStyle = getComputedStyle(name);
      const heroSection = hero.closest('section').getBoundingClientRect();
      startY = 0; endY = Math.max(200, heroSection.bottom + scroll - innerHeight * .35);
      bounds = sourceSpans.map((span,index) => {
        const source = span.getBoundingClientRect();
        const matchedTarget = targetSpans[index]?.getBoundingClientRect();
        const target = matchedTarget || targetSpans.at(-1)?.getBoundingClientRect();
        const glyph = glyphs[index];
        glyph.style.fontFamily = style.fontFamily; glyph.style.fontWeight = style.fontWeight;
        glyph.style.fontSize = style.fontSize; glyph.style.lineHeight = style.lineHeight;
        glyph.style.letterSpacing = style.letterSpacing;
        return {x:source.left,y:source.top+scroll,tx:matchedTarget?.left ?? target?.right ?? source.left,ty:target?.top || 35,scale:parseFloat(targetStyle.fontSize)/parseFloat(style.fontSize),sourceHeight:source.height,targetHeight:target?.height || source.height,extra:!matchedTarget};
      });
      render();
    }
    function render() {
      frame = 0;
      const scroll = window.scrollY;
      const progress = clamp((scroll-startY)/(endY-startY));
      if (identityMatches) {
        const settled = progress >= 1;
        name.style.opacity = settled ? '1' : '0';
        if (brandSub) brandSub.style.opacity = String(ease(progress));
        heroCompanions.forEach(node => node.style.opacity = String(1-ease(clamp(progress/.4))));
        hero.style.opacity = '0';
        overlay.hidden = settled;
        bounds.forEach((box,index) => {
          // Slightly delayed glyphs keep the movement flowing, and all arrive together.
          const delay = index/(bounds.length || 1)*.1;
          const t = ease(clamp((progress-delay)/(1-delay)));
          const x = box.x + (box.tx-box.x)*t;
          const originY = box.y-scroll;
          const y = originY + (box.ty-originY)*t;
          const scale = 1+(box.scale-1)*t;
          const glyph = glyphs[index];
          glyph.style.lineHeight = (box.sourceHeight+(box.targetHeight/box.scale-box.sourceHeight)*t)+'px';
          glyph.style.transform = `translate3d(${x}px,${y}px,0) scale(${scale})`;
          glyph.style.opacity = box.extra ? String(1-ease(clamp(progress*2))) : '1';
        });
      }
      for (const node of layers) {
        const rect = node.getBoundingClientRect();
        if(rect.bottom < -80 || rect.top > innerHeight+160) continue;
        const reveal = ease(clamp((innerHeight-rect.top)/(innerHeight*.28)));
        node.style.setProperty('--reveal',String(reveal));
        const visual = node.matches('.visual,.portrait,.project-visual');
        const drift = visual ? Math.max(-10,Math.min(10,(rect.top-innerHeight*.4)*.025)) : 0;
        node.style.setProperty('--drift',drift+'px');
      }
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
    const resize = () => { measure(); };
    window.addEventListener('scroll',schedule,{passive:true}); window.addEventListener('resize',resize);
    // Filtered story cards are replaced; only persistent content receives reveal layers.
    const observer = new ResizeObserver(resize); observer.observe(document.documentElement);
    measure(); document.fonts.ready.then(()=> { if (!disposed) measure(); });
    teardown = () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll',schedule); window.removeEventListener('resize',resize);
      overlay?.remove(); hero.style.opacity = ''; name.style.opacity = ''; hero.innerHTML = heroHTML; name.textContent = nameText; hero.removeAttribute('aria-label'); name.removeAttribute('aria-label');
      if (brandSub) brandSub.style.opacity = '';
      heroCompanions.forEach(node => node.style.opacity = '');
      layers.forEach(node => { node.classList.remove('scroll-layer'); node.style.removeProperty('--reveal'); node.style.removeProperty('--drift'); });
    };
  };
  setup(); reduced.addEventListener('change',setup);
}
