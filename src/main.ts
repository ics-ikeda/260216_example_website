import "./style.css";

interface WorkViewTransitionOptions {
  updateDom: () => void;
  transitionClassName?: string;
  onFinished?: () => void;
}

const workLightboxImageTransitionName = "work-lightbox-image";
const workOpenTransitionClassName = "is-work-transition-open";
const workCloseTransitionClassName = "is-work-transition-close";
const workNextTransitionClassName = "is-work-transition-next";
const workPreviousTransitionClassName = "is-work-transition-previous";
const workTriggerElements = Array.from(document.querySelectorAll<HTMLButtonElement>(".work__item"));
const workLightboxElement = document.querySelector<HTMLElement>("[data-work-lightbox]");
const workLightboxImageElement = document.querySelector<HTMLImageElement>(
  "[data-work-lightbox-image]",
);
const workLightboxPreviousButton = document.querySelector<HTMLButtonElement>(
  "[data-work-lightbox-previous]",
);
const workLightboxNextButton = document.querySelector<HTMLButtonElement>(
  "[data-work-lightbox-next]",
);
const workLightboxCloseElements = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-work-lightbox-close]"),
);

/**
 * View Transitions APIでDOM更新をアニメーションします。
 */
const runWorkViewTransition = ({
  updateDom,
  transitionClassName,
  onFinished,
}: WorkViewTransitionOptions): void => {
  if (!("startViewTransition" in document)) {
    updateDom();
    onFinished?.();
    return;
  }
  if (transitionClassName) {
    document.documentElement.classList.add(transitionClassName);
  }
  const workViewTransition = document.startViewTransition(updateDom);
  void workViewTransition.finished.finally(() => {
    if (transitionClassName) {
      document.documentElement.classList.remove(transitionClassName);
    }
    onFinished?.();
  });
};

/**
 * カルーセルの範囲内へインデックスを正規化します。
 */
const toLoopedIndex = (targetIndex: number, imageCount: number): number => {
  const fixedImageCount = imageCount || 1;
  return (targetIndex + fixedImageCount) % fixedImageCount;
};

if (
  workTriggerElements.length > 0 &&
  workLightboxElement &&
  workLightboxImageElement &&
  workLightboxPreviousButton &&
  workLightboxNextButton
) {
  const workImagePathList = workTriggerElements.flatMap((workTriggerElement) => {
    const workImageElement =
      workTriggerElement.querySelector<HTMLImageElement>(".media-frame__image");
    const imagePath = workImageElement?.getAttribute("src");
    return imagePath ? [imagePath] : [];
  });
  let currentWorkImageIndex = 0;

  /**
   * 指定インデックスに対応する一覧画像要素を取得します。
   */
  const getWorkThumbnailImageElement = (imageIndex: number): HTMLImageElement | null => {
    const selectedWorkTriggerElement = workTriggerElements[imageIndex];
    if (!selectedWorkTriggerElement) {
      return null;
    }
    return selectedWorkTriggerElement.querySelector<HTMLImageElement>(".media-frame__image");
  };

  /**
   * ライトボックスに表示する画像を更新します。
   */
  const renderWorkImage = (targetIndex: number): void => {
    currentWorkImageIndex = toLoopedIndex(targetIndex, workImagePathList.length);
    const currentImagePath = workImagePathList[currentWorkImageIndex];
    if (!currentImagePath) {
      return;
    }
    workLightboxImageElement.src = currentImagePath;
  };

  /**
   * ライトボックスを開き、指定インデックスの画像を表示します。
   */
  const openWorkLightbox = (targetIndex: number): void => {
    const selectedWorkThumbnailImageElement = getWorkThumbnailImageElement(targetIndex);
    if (selectedWorkThumbnailImageElement) {
      selectedWorkThumbnailImageElement.style.viewTransitionName = workLightboxImageTransitionName;
    }
    runWorkViewTransition({
      transitionClassName: workOpenTransitionClassName,
      updateDom: () => {
        if (selectedWorkThumbnailImageElement) {
          selectedWorkThumbnailImageElement.style.viewTransitionName = "";
        }
        workLightboxImageElement.style.viewTransitionName = workLightboxImageTransitionName;
        renderWorkImage(targetIndex);
        workLightboxElement.hidden = false;
        workLightboxElement.setAttribute("aria-hidden", "false");
        document.body.classList.add("is-work-lightbox-open");
      },
      onFinished: () => {
        if (selectedWorkThumbnailImageElement) {
          selectedWorkThumbnailImageElement.style.viewTransitionName = "";
        }
      },
    });
  };

  /**
   * ライトボックスを閉じます。
   */
  const closeWorkLightbox = (): void => {
    const selectedWorkThumbnailImageElement = getWorkThumbnailImageElement(currentWorkImageIndex);
    runWorkViewTransition({
      transitionClassName: workCloseTransitionClassName,
      updateDom: () => {
        if (selectedWorkThumbnailImageElement) {
          selectedWorkThumbnailImageElement.style.viewTransitionName =
            workLightboxImageTransitionName;
        }
        workLightboxImageElement.style.viewTransitionName = "";
        workLightboxElement.hidden = true;
        workLightboxElement.setAttribute("aria-hidden", "true");
        document.body.classList.remove("is-work-lightbox-open");
      },
      onFinished: () => {
        if (selectedWorkThumbnailImageElement) {
          selectedWorkThumbnailImageElement.style.viewTransitionName = "";
        }
      },
    });
  };

  /**
   * ライトボックス内の画像を前後に移動します。
   */
  const moveWorkLightboxImage = (offset: number): void => {
    const transitionClassName =
      offset > 0 ? workNextTransitionClassName : workPreviousTransitionClassName;
    runWorkViewTransition({
      transitionClassName,
      updateDom: () => {
        renderWorkImage(currentWorkImageIndex + offset);
      },
    });
  };

  workTriggerElements.forEach((workTriggerElement, imageIndex) => {
    workTriggerElement.addEventListener("click", () => {
      openWorkLightbox(imageIndex);
    });
  });

  workLightboxPreviousButton.addEventListener("click", () => {
    moveWorkLightboxImage(-1);
  });

  workLightboxNextButton.addEventListener("click", () => {
    moveWorkLightboxImage(1);
  });

  workLightboxCloseElements.forEach((workLightboxCloseElement) => {
    workLightboxCloseElement.addEventListener("click", () => {
      closeWorkLightbox();
    });
  });

  document.addEventListener("keydown", (keyboardEvent) => {
    if (workLightboxElement.hidden) {
      return;
    }
    if (keyboardEvent.key === "ArrowLeft") {
      moveWorkLightboxImage(-1);
    }
    if (keyboardEvent.key === "ArrowRight") {
      moveWorkLightboxImage(1);
    }
    if (keyboardEvent.key === "Escape") {
      closeWorkLightbox();
    }
  });
}
