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
}

const workLightboxImageTransitionName = "work-lightbox-image";
const workOpenTransitionClassName = "is-work-transition-open";
const workCloseTransitionClassName = "is-work-transition-close";
const workNextTransitionClassName = "is-work-transition-next";
const workPreviousTransitionClassName = "is-work-transition-previous";

/**
 * View Transitions APIでDOM更新をアニメーションします。
 */
const runWorkViewTransition = ({
  updateDom,
  transitionClassName,
  onFinished,
}: WorkViewTransitionOptions) => {
  document.documentElement.classList.add(transitionClassName);
  const workViewTransition = document.startViewTransition(updateDom);
  workViewTransition.finished.finally(() => {
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
const workLightboxImageElement = document.querySelector<HTMLImageElement>(
  "[data-work-lightbox-image]",
)!;
const workItemList = workTriggerElements.map((workTriggerElement) => {
  const thumbnailImageElement =
    workTriggerElement.querySelector<HTMLImageElement>(".media-frame__image")!;
  const imagePath = thumbnailImageElement.src;
  return {
    triggerElement: workTriggerElement,
    thumbnailImageElement,
    imagePath,
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
  const transitionClassName =
    offset > 0 ? workNextTransitionClassName : workPreviousTransitionClassName;
  runWorkViewTransition({
    transitionClassName,
    updateDom: () => {
      renderWorkImage(currentWorkImageIndex + offset);
    },
  });
};

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
