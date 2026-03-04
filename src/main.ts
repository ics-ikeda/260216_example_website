import "./style.css";

type VtArgs = {
  update: () => void;
  cls: string;
  done: () => void;
};

type Item = {
  btn: HTMLButtonElement;
  thumb: HTMLImageElement;
  src: string;
  alt: string;
};

const VT = "work-lightbox-image";
const VT_OPEN = "is-work-transition-open";
const VT_CLOSE = "is-work-transition-close";
const C_NEXT = "is-work-next";
const C_PREV = "is-work-prev";
const C_MOTION = "is-work-motion";
const C_SNAP = "is-work-snap";

const q = <T extends Element>(sel: string): T => document.querySelector<T>(sel)!;
/**
 * インデックスを循環配列の範囲に正規化します。
 */
const loop = (i: number, count: number): number => ((i % count) + count) % count;
/**
 * 画像要素の view-transition-name を設定します。
 */
const setVt = (img: HTMLImageElement, name: string) => {
  img.style.viewTransitionName = name;
};

/**
 * View Transitions API で DOM 更新をアニメーションします。
 */
const runVt = ({ update, cls, done }: VtArgs) => {
  document.documentElement.classList.add(cls);
  document.startViewTransition(update).finished.finally(() => {
    document.documentElement.classList.remove(cls);
    done();
  });
};

const nav = q<HTMLDialogElement>("#menu-dialog");
const workBtns = Array.from(document.querySelectorAll<HTMLButtonElement>(".work__item"));
const lightbox = q<HTMLElement>("[data-work-lightbox]");
const stage = q<HTMLElement>("[data-work-lightbox-image-stage]");
const img = q<HTMLImageElement>("[data-work-lightbox-image]");
const ghost = q<HTMLImageElement>("[data-work-lightbox-image-ghost]");

const items: Item[] = workBtns.map((btn) => {
  const thumb = btn.querySelector<HTMLImageElement>(".media-frame__image")!;
  return { btn, thumb, src: thumb.src, alt: thumb.alt };
});

let index = 0;

const itemAt = (i: number): Item => items[loop(i, items.length)];
const clearMotion = () => stage.classList.remove(C_NEXT, C_PREV, C_MOTION, C_SNAP);
const reflow = () => stage.getBoundingClientRect();

/**
 * ライトボックスに指定画像を表示します。
 */
const show = (i: number) => {
  const item = itemAt(i);
  index = loop(i, items.length);
  img.src = item.src;
  img.alt = item.alt;
};

/**
 * prev/next モーション終了後の表示状態を確定します。
 */
const finishMotion = () => {
  stage.classList.add(C_SNAP);
  show(index);
  ghost.src = "";
  ghost.alt = "";
  stage.classList.remove(C_NEXT, C_PREV, C_MOTION);
  reflow();
  stage.classList.remove(C_SNAP);
};

/**
 * prev/next モーションを開始します。
 */
const startMotion = (offset: number) => {
  const item = itemAt(index + offset);
  index = loop(index + offset, items.length);
  clearMotion();
  ghost.src = item.src;
  ghost.alt = item.alt;
  stage.classList.add(C_SNAP, offset > 0 ? C_NEXT : C_PREV);
  reflow();
  stage.classList.remove(C_SNAP);
  reflow();
  stage.classList.add(C_MOTION);
};

/**
 * ライトボックスを開きます。
 */
const open = (i: number) => {
  const thumb = itemAt(i).thumb;
  setVt(thumb, VT);
  runVt({
    cls: VT_OPEN,
    update: () => {
      setVt(thumb, "");
      setVt(img, VT);
      show(i);
      clearMotion();
      ghost.src = "";
      ghost.alt = "";
      lightbox.hidden = false;
      document.body.classList.add("is-work-lightbox-open");
    },
    done: () => setVt(thumb, ""),
  });
};

/**
 * ライトボックスを閉じます。
 */
const close = () => {
  const thumb = itemAt(index).thumb;
  runVt({
    cls: VT_CLOSE,
    update: () => {
      setVt(thumb, VT);
      setVt(img, "");
      clearMotion();
      ghost.src = "";
      ghost.alt = "";
      lightbox.hidden = true;
      document.body.classList.remove("is-work-lightbox-open");
    },
    done: () => setVt(thumb, ""),
  });
};

img.addEventListener("transitionend", (event) => {
  if (!stage.classList.contains(C_MOTION) || event.propertyName !== "transform") {
    return;
  }
  finishMotion();
});

nav.addEventListener("click", (event) => {
  if ((event.target as Element).closest("a")) {
    nav.close();
  }
});

items.forEach(({ btn }, i) => {
  btn.addEventListener("click", () => open(i));
});

lightbox.addEventListener("click", (event) => {
  const el = event.target as Element;
  if (el.closest("[data-work-lightbox-close]")) {
    close();
    return;
  }
  if (el.closest("[data-work-lightbox-previous]")) {
    startMotion(-1);
    return;
  }
  if (el.closest("[data-work-lightbox-next]")) {
    startMotion(1);
  }
});

document.addEventListener("keydown", (event) => {
  if (lightbox.hidden) {
    return;
  }
  if (event.key === "ArrowLeft") {
    startMotion(-1);
    return;
  }
  if (event.key === "ArrowRight") {
    startMotion(1);
    return;
  }
  if (event.key === "Escape") {
    close();
  }
});
