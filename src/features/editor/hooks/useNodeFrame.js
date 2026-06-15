import { useEditor, useNode } from "@craftjs/core";
import { Move } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { clamp } from "../utils/editorUtils";

const nestingActivationDelayMs = 700;
const pointerChangeHistoryThrottleMs = 60000;

function isOptionDown(event) {
  return Boolean(event.altKey || event.getModifierState?.("Alt"));
}

function isOptionKey(event) {
  return event.key === "Alt" || event.code === "AltLeft" || event.code === "AltRight";
}

function overlaps(startA, endA, startB, endB) {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

function horizontalMeasurement(x, y, width, label) {
  if (width <= 0) return null;
  return {
    kind: "h",
    label,
    lineStyle: {
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
    },
  };
}

function verticalMeasurement(x, y, height, label) {
  if (height <= 0) return null;
  return {
    kind: "v",
    label,
    lineStyle: {
      left: `${x}px`,
      top: `${y}px`,
      height: `${height}px`,
    },
  };
}

function getElementScale(element) {
  if (!element) return 1;
  return element.offsetWidth
    ? element.getBoundingClientRect().width / element.offsetWidth
    : 1;
}

function lineYBetween(firstRect, secondRect) {
  if (overlaps(firstRect.top, firstRect.bottom, secondRect.top, secondRect.bottom)) {
    return (Math.max(firstRect.top, secondRect.top) + Math.min(firstRect.bottom, secondRect.bottom)) / 2;
  }

  return (firstRect.top + firstRect.height / 2 + secondRect.top + secondRect.height / 2) / 2;
}

function lineXBetween(firstRect, secondRect) {
  if (overlaps(firstRect.left, firstRect.right, secondRect.left, secondRect.right)) {
    return (Math.max(firstRect.left, secondRect.left) + Math.min(firstRect.right, secondRect.right)) / 2;
  }

  return (firstRect.left + firstRect.width / 2 + secondRect.left + secondRect.width / 2) / 2;
}

function buildNodeMeasurements(shellRect, targetRect, scale) {
  const items = [];

  if (targetRect.right <= shellRect.left) {
    const gap = shellRect.left - targetRect.right;
    items.push(horizontalMeasurement(targetRect.right, lineYBetween(shellRect, targetRect), gap, Math.round(gap / scale)));
  } else if (shellRect.right <= targetRect.left) {
    const gap = targetRect.left - shellRect.right;
    items.push(horizontalMeasurement(shellRect.right, lineYBetween(shellRect, targetRect), gap, Math.round(gap / scale)));
  }

  if (targetRect.bottom <= shellRect.top) {
    const gap = shellRect.top - targetRect.bottom;
    items.push(verticalMeasurement(lineXBetween(shellRect, targetRect), targetRect.bottom, gap, Math.round(gap / scale)));
  } else if (shellRect.bottom <= targetRect.top) {
    const gap = targetRect.top - shellRect.bottom;
    items.push(verticalMeasurement(lineXBetween(shellRect, targetRect), shellRect.bottom, gap, Math.round(gap / scale)));
  }

  return items.filter(Boolean);
}

function buildMeasurements(shell, hoveredSiblingNode) {
  const surface = shell?.closest(".layout-surface");
  if (!shell || !surface) return [];

  const shellRect = shell.getBoundingClientRect();
  const surfaceRect = surface.getBoundingClientRect();
  const scale = getElementScale(surface);
  const hoveredSiblingDom = hoveredSiblingNode?.dom;
  const hoveredSiblingSurface = hoveredSiblingDom?.closest?.(".layout-surface");

  if (hoveredSiblingDom && hoveredSiblingSurface === surface) {
    return buildNodeMeasurements(shellRect, hoveredSiblingDom.getBoundingClientRect(), scale);
  }

  const centerX = shellRect.left + shellRect.width / 2;
  const centerY = shellRect.top + shellRect.height / 2;

  return [
    horizontalMeasurement(
      surfaceRect.left,
      centerY,
      shellRect.left - surfaceRect.left,
      Math.round((shellRect.left - surfaceRect.left) / scale),
    ),
    horizontalMeasurement(
      shellRect.right,
      centerY,
      surfaceRect.right - shellRect.right,
      Math.round((surfaceRect.right - shellRect.right) / scale),
    ),
    verticalMeasurement(
      centerX,
      surfaceRect.top,
      shellRect.top - surfaceRect.top,
      Math.round((shellRect.top - surfaceRect.top) / scale),
    ),
    verticalMeasurement(
      centerX,
      shellRect.bottom,
      surfaceRect.bottom - shellRect.bottom,
      Math.round((surfaceRect.bottom - shellRect.bottom) / scale),
    ),
  ].filter(Boolean);
}

export function useNodeFrame({
  layout = "flow",
  minResizeHeight = 32,
  minResizeWidth = 72,
  x = 0,
  y = 0,
  width,
  height,
}) {
  const shellRef = useRef(null);
  const [altDown, setAltDown] = useState(false);
  const [measurements, setMeasurements] = useState([]);
  const {
    connectors: { connect, drag },
    id,
    parentId,
    selected,
    hovered,
  } = useNode((node) => ({
    id: node.id,
    parentId: node.data.parent,
    selected: node.events.selected,
    hovered: node.events.hovered,
  }));

  const {
    actions: editorActions,
    hoveredSiblingId,
    nodes,
    parentLayoutMode,
    selectedIds,
  } = useEditor((state) => ({
    hoveredSiblingId: Object.entries(state.nodes).find(([nodeId, node]) => (
      nodeId !== id && node?.data.parent === parentId && node.events.hovered
    ))?.[0] || null,
    nodes: state.nodes,
    parentLayoutMode: parentId
      ? state.nodes[parentId]?.data.props.layoutMode
      : null,
    selectedIds: state.events.selected ? Array.from(state.events.selected) : [],
  }));

  const isFixed = parentLayoutMode
    ? parentLayoutMode === "free"
    : layout === "fixed";
  const shellStyle = {
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined,
    left: isFixed ? `${x}px` : undefined,
    top: isFixed ? `${y}px` : undefined,
  };

  const connectNode = (ref) => {
    if (!ref) return;
    shellRef.current = ref;
    isFixed ? connect(ref) : connect(drag(ref));
  };

  const updateMeasurements = () => {
    setMeasurements(buildMeasurements(shellRef.current, nodes[hoveredSiblingId]));
  };

  const clearMeasurements = () => {
    setAltDown(false);
    setMeasurements([]);
  };

  useEffect(() => {
    if (!selected) {
      setMeasurements([]);
      return undefined;
    }

    const keyDown = (event) => {
      if (!isOptionDown(event)) return;

      setAltDown(true);
      requestAnimationFrame(updateMeasurements);
    };
    const keyUp = (event) => {
      if (!isOptionKey(event) && isOptionDown(event)) return;

      clearMeasurements();
    };
    const visibilityChange = () => {
      if (document.visibilityState !== "visible") {
        clearMeasurements();
      }
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", clearMeasurements);
    document.addEventListener("visibilitychange", visibilityChange);

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", clearMeasurements);
      document.removeEventListener("visibilitychange", visibilityChange);
    };
  }, [hoveredSiblingId, nodes, selected]);

  useEffect(() => {
    if (selected && altDown) {
      updateMeasurements();
    }
  }, [altDown, height, hoveredSiblingId, selected, width, x, y]);

  const startMove = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const canvas = event.currentTarget.closest(".layout-surface");
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const canvasScale = getElementScale(canvas);
    const canvasWidth = canvasRect.width / canvasScale;
    const canvasHeight = canvasRect.height / canvasScale;
    const shell = event.currentTarget.classList.contains("node-shell")
      ? event.currentTarget
      : event.currentTarget.closest(".node-shell");
    if (!shell) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const originX = x;
    const originY = y;
    const nodeWidth = width || shell.offsetWidth;
    const nodeHeight = height || shell.offsetHeight;
    const shellRect = shell.getBoundingClientRect();
    const grabOffsetX = (startX - shellRect.left) / canvasScale;
    const grabOffsetY = (startY - shellRect.top) / canvasScale;
    const groupIds =
      selectedIds.length > 1 && selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => {
            const node = nodes[selectedId];
            return (
              selectedId !== "ROOT" &&
              node?.data.parent === parentId &&
              (parentLayoutMode === "free" ||
                node.data.props.layout === "fixed")
            );
          })
        : [];
    const groupOrigins = groupIds.map((selectedId) => {
      const node = nodes[selectedId];
      const dom = node.dom;
      const props = node.data.props;
      return {
        id: selectedId,
        x: props.x ?? dom?.offsetLeft ?? 0,
        y: props.y ?? dom?.offsetTop ?? 0,
        width: props.width ?? dom?.offsetWidth ?? 0,
        height: props.height ?? dom?.offsetHeight ?? 0,
      };
    });
    const groupBox = groupOrigins.length
      ? {
          left: Math.min(...groupOrigins.map((item) => item.x)),
          top: Math.min(...groupOrigins.map((item) => item.y)),
          right: Math.max(...groupOrigins.map((item) => item.x + item.width)),
          bottom: Math.max(...groupOrigins.map((item) => item.y + item.height)),
        }
      : null;
    let lastClientX = event.clientX;
    let lastClientY = event.clientY;
    let nestingCandidateId = null;
    let nestingCandidateSurface = null;
    let nestingReadyId = null;
    let nestingReadySurface = null;
    let nestingTimer = null;
    let hasRecordedDragHistory = false;

    const dragHistoryActions = () => {
      if (hasRecordedDragHistory) {
        return editorActions.history.throttle(pointerChangeHistoryThrottleMs);
      }

      hasRecordedDragHistory = true;
      return editorActions;
    };

    const clearNestingTarget = () => {
      window.clearTimeout(nestingTimer);
      nestingTimer = null;
      nestingCandidateSurface?.classList.remove(
        "is-nesting-target-pending",
        "is-nesting-target-ready",
      );
      nestingReadySurface?.classList.remove(
        "is-nesting-target-pending",
        "is-nesting-target-ready",
      );
      nestingCandidateId = null;
      nestingCandidateSurface = null;
      nestingReadyId = null;
      nestingReadySurface = null;
    };

    const canNestInto = (nextParentId) => {
      if (!nextParentId || nextParentId === parentId || nextParentId === id)
        return false;

      let cursorParentId = nextParentId;
      while (cursorParentId) {
        if (cursorParentId === id) return false;
        cursorParentId = nodes[cursorParentId]?.data.parent;
      }

      return true;
    };

    const nestingTargetAt = (clientX, clientY) => {
      const previousPointerEvents = shell.style.pointerEvents;
      shell.style.pointerEvents = "none";
      const target = document.elementFromPoint(clientX, clientY);
      shell.style.pointerEvents = previousPointerEvents;
      const targetSurface = target?.closest?.(".layout-surface");
      const nextParentId =
        targetSurface?.dataset.nodeId ||
        targetSurface?.closest?.(".node-shell")?.dataset.nodeId;

      if (!targetSurface || !canNestInto(nextParentId)) return null;
      return { id: nextParentId, surface: targetSurface };
    };

    const updateNestingTarget = (clientX, clientY) => {
      const target = nestingTargetAt(clientX, clientY);
      if (target?.id === nestingCandidateId) return;

      clearNestingTarget();
      if (!target) return;

      nestingCandidateId = target.id;
      nestingCandidateSurface = target.surface;
      nestingCandidateSurface.classList.add("is-nesting-target-pending");
      nestingTimer = window.setTimeout(() => {
        nestingReadyId = target.id;
        nestingReadySurface = target.surface;
        nestingCandidateSurface?.classList.remove("is-nesting-target-pending");
        nestingReadySurface?.classList.add("is-nesting-target-ready");
      }, nestingActivationDelayMs);
    };

    const move = (moveEvent) => {
      lastClientX = moveEvent.clientX;
      lastClientY = moveEvent.clientY;
      let deltaX = (moveEvent.clientX - startX) / canvasScale;
      let deltaY = (moveEvent.clientY - startY) / canvasScale;
      if (moveEvent.shiftKey) {
        if (Math.abs(deltaX) >= Math.abs(deltaY)) {
          deltaY = 0;
        } else {
          deltaX = 0;
        }
      }
      const maxDeltaX = groupBox
        ? canvasWidth - (groupBox.right - groupBox.left) - groupBox.left
        : canvasWidth - nodeWidth - originX;
      const maxDeltaY = groupBox
        ? canvasHeight - (groupBox.bottom - groupBox.top) - groupBox.top
        : canvasHeight - nodeHeight - originY;
      const clampedDeltaX = clamp(
        deltaX,
        groupBox ? -groupBox.left : -originX,
        maxDeltaX,
      );
      const clampedDeltaY = clamp(
        deltaY,
        groupBox ? -groupBox.top : -originY,
        maxDeltaY,
      );
      const nextX = clamp(originX + clampedDeltaX, 0, canvasWidth - nodeWidth);
      const nextY = clamp(
        originY + clampedDeltaY,
        0,
        canvasHeight - nodeHeight,
      );

      if (groupOrigins.length > 1) {
        groupOrigins.forEach((item) => {
          dragHistoryActions().setProp(item.id, (draft) => {
            draft.x = Math.round(item.x + clampedDeltaX);
            draft.y = Math.round(item.y + clampedDeltaY);
          });
        });
      } else {
        dragHistoryActions().setProp(id, (draft) => {
          draft.x = Math.round(nextX);
          draft.y = Math.round(nextY);
        });
      }

      if (isOptionDown(moveEvent)) {
        requestAnimationFrame(updateMeasurements);
      } else if (measurements.length) {
        setMeasurements([]);
      }

      updateNestingTarget(moveEvent.clientX, moveEvent.clientY);
    };

    const stop = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
      if (!altDown) setMeasurements([]);

      const target = nestingTargetAt(lastClientX, lastClientY);
      const targetSurface =
        target?.id === nestingReadyId ? target.surface : null;
      const nextParentId = target?.id === nestingReadyId ? target.id : null;

      clearNestingTarget();
      if (!targetSurface || !nextParentId) return;

      const nextParent = nodes[nextParentId];
      const nextParentLayoutMode =
        nextParent?.data.props.layoutMode || "vertical";
      const nextParentRect = targetSurface.getBoundingClientRect();
      const nextParentScale = getElementScale(targetSurface);
      const nextParentWidth = nextParentRect.width / nextParentScale;
      const nextParentHeight = nextParentRect.height / nextParentScale;
      const maxNextX = Math.max(0, nextParentWidth - nodeWidth);
      const maxNextY = Math.max(0, nextParentHeight - nodeHeight);
      const nextX = clamp(
        (lastClientX - nextParentRect.left) / nextParentScale - grabOffsetX,
        0,
        maxNextX,
      );
      const nextY = clamp(
        (lastClientY - nextParentRect.top) / nextParentScale - grabOffsetY,
        0,
        maxNextY,
      );

      dragHistoryActions().setProp(id, (draft) => {
        draft.layout = nextParentLayoutMode === "free" ? "fixed" : "flow";
        if (nextParentLayoutMode === "free") {
          draft.x = Math.round(nextX);
          draft.y = Math.round(nextY);
        }
      });
      dragHistoryActions().move(id, nextParentId, nextParent?.data.nodes.length || 0);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  };

  const startResize = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const shell = event.currentTarget.parentElement;
    const scale = getElementScale(shell);
    const startX = event.clientX;
    const startY = event.clientY;
    const originWidth = shell.offsetWidth;
    const originHeight = shell.offsetHeight;
    let hasRecordedResizeHistory = false;

    const resizeHistoryActions = () => {
      if (hasRecordedResizeHistory) {
        return editorActions.history.throttle(pointerChangeHistoryThrottleMs);
      }

      hasRecordedResizeHistory = true;
      return editorActions;
    };

    const move = (moveEvent) => {
      let nextWidth = originWidth + (moveEvent.clientX - startX) / scale;
      let nextHeight = originHeight + (moveEvent.clientY - startY) / scale;
      if (moveEvent.shiftKey && originHeight > 0) {
        const aspectRatio = originWidth / originHeight;
        if (
          Math.abs(moveEvent.clientX - startX) >=
          Math.abs(moveEvent.clientY - startY)
        ) {
          nextHeight = nextWidth / aspectRatio;
        } else {
          nextWidth = nextHeight * aspectRatio;
        }
      }

      resizeHistoryActions().setProp(id, (draft) => {
        draft.width = Math.round(clamp(nextWidth, minResizeWidth, 960));
        draft.height = Math.round(clamp(nextHeight, minResizeHeight, 720));
      });

      if (isOptionDown(moveEvent)) requestAnimationFrame(updateMeasurements);
    };

    const stop = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  };

  return {
    connectNode,
    hovered,
    id,
    isFixed,
    selected,
    shellElement: shellRef.current,
    shellStyle,
    startMove,
    startResize,
    MoveIcon: Move,
    measurements,
  };
}
