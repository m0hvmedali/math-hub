// @ts-ignore
import * as fabricValues from './fabric-bundle.mjs';

// Re-export values from the local bundle to bypass package.json exports restrictions
export const {
    Canvas,
    Rect,
    Circle,
    Line,
    Triangle,
    PencilBrush,
    SprayBrush,
    CircleBrush,
    PatternBrush,
    Image,
    ActiveSelection,
    util,
    Point
} = fabricValues;

// Re-export types from the actual 'fabric' package for full IDE support
export type {
    Canvas as FabricCanvasType,
    Rect as RectType,
    Circle as CircleType,
    Line as LineType,
    Triangle as TriangleType,
    PencilBrush as PencilBrushType,
    SprayBrush as SprayBrushType,
    CircleBrush as CircleBrushType,
    PatternBrush as PatternBrushType,
    FabricImage as FabricImageType
} from 'fabric';
