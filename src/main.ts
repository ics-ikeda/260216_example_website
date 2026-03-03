import "./style.css";

interface WorkViewTransitionOptions {
  updateDom: () => void;
  transitionClassName: string;
  onFinished?: () => void;
}

interface WorkItem {
  triggerElement: HTMLButtonElement;
  thumbnailImageElement: HTMLImageElement;
  imagePath: string;
  imageAlt: string;
}

const workLightboxImageTransitionName = "work-lightbox-image";
const workOpenTransitionClassName = "is-work-transition-open";
const workCloseTransitionClassName = "is-work-transition-close";
const workLightboxImageNextMotionClassName = "is-work-lightbox-image-next";
const workLightboxImagePreviousMotionClassName = "is-work-lightbox-image-previous";
const workLightboxImageMotionClassName = "is-work-lightbox-image-motion";
const workLightboxImageSnapClassName = "is-work-lightbox-image-snap";
const workLightboxImageMotionDurationMs = 260;
let isWorkViewTransitionRunning = false;
let workLightboxImageMotionResetTimerId: number | null = null;

/**
 * View Transitions APIでDOM更新をアニメーションします。
 */
const runWorkViewTransition = ({
  updateDom,
  transitionClassName,
  onFinished,
}: WorkViewTransitionOptions) => {
  if (typeof document.startViewTransition !== "function" || isWorkViewTransitionRunning) {
    updateDom();
    onFinished?.();
    return;
  }

  document.documentElement.classList.add(transitionClassName);
  isWorkViewTransitionRunning = true;
  let workViewTransition: ViewTransition;
  try {
    workViewTransition = document.startViewTransition(updateDom);
  } catch {
    isWorkViewTransitionRunning = false;
    document.documentElement.classList.remove(transitionClassName);
    updateDom();
    onFinished?.();
    return;
  }
  workViewTransition.finished.finally(() => {
    isWorkViewTransitionRunning = false;
    document.documentElement.classList.remove(transitionClassName);
    onFinished?.();
  });
};

/**
 * カルーセルの範囲内へインデックスを正規化します。
 */
const toLoopedIndex = (targetIndex: number, imageCount: number): number => {
  return ((targetIndex % imageCount) + imageCount) % imageCount;
};

/**
 * 画像要素の `view-transition-name` を設定します。
 */
const setViewTransitionName = (imageElement: HTMLImageElement, transitionName: string) => {
  imageElement.style.viewTransitionName = transitionName;
};

const siteHeaderMenuToggleElement = document.querySelector<HTMLInputElement>(
  ".site-header__menu-toggle",
)!;
const siteHeaderNavElement = document.querySelector<HTMLElement>(".site-header__nav")!;
const workTriggerElements = Array.from(document.querySelectorAll<HTMLButtonElement>(".work__item"));
const workLightboxElement = document.querySelector<HTMLElement>("[data-work-lightbox]")!;
const workLightboxImageStageElement = document.querySelector<HTMLElement>(
  "[data-work-lightbox-image-stage]",
)!;
const workLightboxImageElement = document.querySelector<HTMLImageElement>(
  "[data-work-lightbox-image]",
)!;
const workLightboxGhostImageElement = document.querySelector<HTMLImageElement>(
  "[data-work-lightbox-image-ghost]",
)!;
const workItemList = workTriggerElements.map((workTriggerElement) => {
  const thumbnailImageElement =
    workTriggerElement.querySelector<HTMLImageElement>(".media-frame__image")!;
  const imagePath = thumbnailImageElement.src;
  return {
    triggerElement: workTriggerElement,
    thumbnailImageElement,
    imagePath,
    imageAlt: thumbnailImageElement.alt,
  } satisfies WorkItem;
});

let currentWorkImageIndex = 0;

/**
 * 指定インデックスに対応する一覧画像要素を取得します。
 */
const getWorkThumbnailImageElement = (imageIndex: number): HTMLImageElement => {
  const selectedWorkImageIndex = toLoopedIndex(imageIndex, workItemList.length);
  return workItemList[selectedWorkImageIndex].thumbnailImageElement;
};

/**
 * ライトボックスに表示する画像を更新します。
 */
const renderWorkImage = (targetIndex: number) => {
  const nextWorkImageIndex = toLoopedIndex(targetIndex, workItemList.length);
  const selectedWorkItem = workItemList[nextWorkImageIndex];
  currentWorkImageIndex = nextWorkImageIndex;
  workLightboxImageElement.src = selectedWorkItem.imagePath;
  workLightboxImageElement.alt = selectedWorkItem.imageAlt;
};

const resetWorkLightboxImageMotion = () => {
  workLightboxImageStageElement.classList.remove(
    workLightboxImageNextMotionClassName,
    workLightboxImagePreviousMotionClassName,
    workLightboxImageMotionClassName,
    workLightboxImageSnapClassName,
  );
  if (workLightboxImageMotionResetTimerId !== null) {
    window.clearTimeout(workLightboxImageMotionResetTimerId);
    workLightboxImageMotionResetTimerId = null;
  }
};

const forceWorkLightboxImageReflow = () => {
  workLightboxImageStageElement.getBoundingClientRect();
};

/**
 * ライトボックス画像に前後移動のモーションを適用します。
 */
const finalizeWorkLightboxImageMotion = () => {
  if (!workLightboxImageStageElement.classList.contains(workLightboxImageMotionClassName)) {
    return;
  }
  if (workLightboxImageMotionResetTimerId !== null) {
    window.clearTimeout(workLightboxImageMotionResetTimerId);
    workLightboxImageMotionResetTimerId = null;
  }
  workLightboxImageStageElement.classList.add(workLightboxImageSnapClassName);
  if (workLightboxGhostImageElement.src) {
    workLightboxImageElement.src = workLightboxGhostImageElement.src;
    workLightboxImageElement.alt = workLightboxGhostImageElement.alt;
  }
  workLightboxGhostImageElement.src = "";
  workLightboxGhostImageElement.alt = "";
  workLightboxImageStageElement.classList.remove(
    workLightboxImageNextMotionClassName,
    workLightboxImagePreviousMotionClassName,
    workLightboxImageMotionClassName,
  );
  forceWorkLightboxImageReflow();
  workLightboxImageStageElement.classList.remove(workLightboxImageSnapClassName);
};

const playWorkLightboxImageMotion = (
  offset: number,
  nextImagePath: string,
  nextImageAlt: string,
) => {
  resetWorkLightboxImageMotion();
  workLightboxGhostImageElement.src = nextImagePath;
  workLightboxGhostImageElement.alt = nextImageAlt;
  const directionClassName =
    offset > 0 ? workLightboxImageNextMotionClassName : workLightboxImagePreviousMotionClassName;
  workLightboxImageStageElement.classList.add(workLightboxImageSnapClassName, directionClassName);
  forceWorkLightboxImageReflow();
  workLightboxImageStageElement.classList.remove(workLightboxImageSnapClassName);
  forceWorkLightboxImageReflow();
  workLightboxImageStageElement.classList.add(workLightboxImageMotionClassName);
  workLightboxImageMotionResetTimerId = window.setTimeout(() => {
    finalizeWorkLightboxImageMotion();
  }, workLightboxImageMotionDurationMs);
};

/**
 * ライトボックスを開き、指定インデックスの画像を表示します。
 */
const openWorkLightbox = (targetIndex: number) => {
  const selectedWorkThumbnailImageElement = getWorkThumbnailImageElement(targetIndex);
  setViewTransitionName(selectedWorkThumbnailImageElement, workLightboxImageTransitionName);
  runWorkViewTransition({
    transitionClassName: workOpenTransitionClassName,
    updateDom: () => {
      setViewTransitionName(selectedWorkThumbnailImageElement, "");
      setViewTransitionName(workLightboxImageElement, workLightboxImageTransitionName);
      renderWorkImage(targetIndex);
      resetWorkLightboxImageMotion();
      workLightboxGhostImageElement.src = "";
      workLightboxGhostImageElement.alt = "";
      workLightboxElement.hidden = false;
      document.body.classList.add("is-work-lightbox-open");
    },
    onFinished: () => {
      setViewTransitionName(selectedWorkThumbnailImageElement, "");
    },
  });
};

/**
 * ライトボックスを閉じます。
 */
const closeWorkLightbox = () => {
  const selectedWorkThumbnailImageElement = getWorkThumbnailImageElement(currentWorkImageIndex);
  runWorkViewTransition({
    transitionClassName: workCloseTransitionClassName,
    updateDom: () => {
      setViewTransitionName(selectedWorkThumbnailImageElement, workLightboxImageTransitionName);
      setViewTransitionName(workLightboxImageElement, "");
      resetWorkLightboxImageMotion();
      workLightboxGhostImageElement.src = "";
      workLightboxGhostImageElement.alt = "";
      workLightboxElement.hidden = true;
      document.body.classList.remove("is-work-lightbox-open");
    },
    onFinished: () => {
      setViewTransitionName(selectedWorkThumbnailImageElement, "");
    },
  });
};

/**
 * ライトボックス内の画像を前後に移動します。
 */
const moveWorkLightboxImage = (offset: number) => {
  const nextWorkImageIndex = toLoopedIndex(currentWorkImageIndex + offset, workItemList.length);
  const selectedWorkItem = workItemList[nextWorkImageIndex];
  currentWorkImageIndex = nextWorkImageIndex;
  playWorkLightboxImageMotion(offset, selectedWorkItem.imagePath, selectedWorkItem.imageAlt);
};

workLightboxImageStageElement.addEventListener("transitionend", (transitionEvent) => {
  if (!workLightboxImageStageElement.classList.contains(workLightboxImageMotionClassName)) {
    return;
  }
  if (transitionEvent.propertyName !== "transform") {
    return;
  }
  if (!(transitionEvent.target instanceof HTMLImageElement)) {
    return;
  }
  if (!transitionEvent.target.classList.contains("work-lightbox__image--current")) {
    return;
  }
  finalizeWorkLightboxImageMotion();
});

siteHeaderNavElement.addEventListener("click", (mouseEvent) => {
  const clickedElement = mouseEvent.target as Element;
  if (clickedElement.closest("a")) {
    siteHeaderMenuToggleElement.checked = false;
  }
});

workItemList.forEach(({ triggerElement }, imageIndex) => {
  triggerElement.addEventListener("click", () => {
    openWorkLightbox(imageIndex);
  });
});

workLightboxElement.addEventListener("click", (mouseEvent) => {
  const clickedElement = mouseEvent.target as Element;
  if (clickedElement.closest("[data-work-lightbox-close]")) {
    closeWorkLightbox();
    return;
  }
  if (clickedElement.closest("[data-work-lightbox-previous]")) {
    moveWorkLightboxImage(-1);
    return;
  }
  if (clickedElement.closest("[data-work-lightbox-next]")) {
    moveWorkLightboxImage(1);
  }
});

document.addEventListener("keydown", (keyboardEvent) => {
  if (workLightboxElement.hidden) {
    return;
  }
  switch (keyboardEvent.key) {
    case "ArrowLeft":
      moveWorkLightboxImage(-1);
      break;
    case "ArrowRight":
      moveWorkLightboxImage(1);
      break;
    case "Escape":
      closeWorkLightbox();
      break;
    default:
      break;
  }
});
