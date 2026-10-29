export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

interface ErrorResponse {
  statusCode: number;
  message: string;
}

const PG_INVALID_TEXT_REPRESENTATION = "22P02"; // e.g. a malformed uuid
const GENERIC_MESSAGE = "Something went wrong on our side. Please try again.";

function readProp(error: Error, key: string): unknown {
  return (error as unknown as Record<string, unknown>)[key];
}

export function toErrorResponse(error: Error): ErrorResponse {
  if (error instanceof AppError) {
    return { statusCode: error.statusCode, message: error.message };
  }

  if (readProp(error, "code") === PG_INVALID_TEXT_REPRESENTATION) {
    return { statusCode: 400, message: "That identifier is not valid" };
  }

  const statusCode = readProp(error, "statusCode");
  if (typeof statusCode === "number" && statusCode >= 400 && statusCode < 500) {
    return { statusCode, message: error.message };
  }

  return { statusCode: 500, message: GENERIC_MESSAGE };
}