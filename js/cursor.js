/**
 * CustomCursor — small blue dot that trails the real pointer with easing
 * (lag in, gentle deceleration on stop), and grows subtly over
 * interactive elements. Position is written straight to the DOM inside
 * the shared rAF loop (see main.js) — no React/framework re-renders.
 */
window.CustomCursor = class CustomCursor {
  constructor(el) {
    this.el = el;
    this.x = window.innerWidth / 2;
    this.y = window.innerHeight / 2;
    this.targetX = this.x;
    this.targetY = this.y;
    this.hovering = false;
    this.revealed = false;

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onOver = this._onOver.bind(this);
    this._onOut = this._onOut.bind(this);
    this._onDown = this._onDown.bind(this);
    this._onUp = this._onUp.bind(this);

    window.addEventListener("mousemove", this._onMouseMove, { passive: true });
    document.addEventListener("mouseover", this._onOver);
    document.addEventListener("mouseout", this._onOut);
    window.addEventListener("mousedown", this._onDown);
    window.addEventListener("mouseup", this._onUp);
  }

  _onMouseMove(e) {
    this.targetX = e.clientX;
    this.targetY = e.clientY;
    if (!this.revealed) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.revealed = true;
      this.el.classList.add("custom-cursor--visible");
    }
  }

  _onOver(e) {
    if (e.target.closest && e.target.closest(".js-cursor-hover")) {
      this._setHover(true);
    }
  }

  _onOut(e) {
    if (e.target.closest && e.target.closest(".js-cursor-hover")) {
      this._setHover(false);
    }
  }

  _onDown() {
    this.el.classList.add("custom-cursor--down");
  }

  _onUp() {
    this.el.classList.remove("custom-cursor--down");
  }

  _setHover(v) {
    if (v === this.hovering) return;
    this.hovering = v;
    this.el.classList.toggle("custom-cursor--hover", v);
  }

  /** Called every animation frame with the elapsed ms since last frame. */
  update(dt) {
    const ease = window.Utils.easeFactor(0.22, dt);
    this.x += (this.targetX - this.x) * ease;
    this.y += (this.targetY - this.y) * ease;
    this.el.style.transform = `translate3d(${this.x.toFixed(2)}px, ${this.y.toFixed(2)}px, 0)`;
  }
};
