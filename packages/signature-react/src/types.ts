export type StrokePoint = {
  x: number;
  y: number;
  time: number;
};

export type SignaturePath = {
  d: string;
  length: number;
};

export type SignatureVector = {
  width: number;
  height: number;
  viewBox: string;
  paths: SignaturePath[];
};

export type PathMetricSegment = {
  d: string;
  length: number;
  start: number;
  end: number;
};

export type PathMetrics = {
  totalLength: number;
  segments: PathMetricSegment[];
};
