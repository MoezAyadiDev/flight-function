export abstract class Failures extends Error {
  code: string;
  statusCode: number;
  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
  toJson(): { code: string; message: string } {
    return {
      code: this.code,
      message: this.message,
    };
  }
}

export class AutorisationFailures extends Failures {
  constructor() {
    super(
      401,
      "Unautorized",
      "Access to this resource requires valid credentials."
    );
  }
}
