import type { Response } from "express";

export const sendOk = <T>(res: Response, data: T) => {
  res.status(200).json({
    success: true,
    data,
  });
};

