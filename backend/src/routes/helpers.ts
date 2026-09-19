import type { NextFunction, Request, Response } from 'express';

/** Wraps async handlers so rejections reach the error middleware. */
export function asyncRoute(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
