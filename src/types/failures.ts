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

export class MethodeFailures extends Failures {
  constructor() {
    super(400, "METHOD_FAILURE", "Methode not allowed");
  }
}

export class QueryFailure extends Failures {
  constructor(text: string) {
    super(
      400,
      "MISSING_PARAMETER",
      `The request is missing the required ${text} parameter`
    );
  }
}

export class QueryTypeFailure extends Failures {
  constructor(text: string, typeQuery: string) {
    super(
      400,
      "WRONG_PARAMETER",
      `Invalid parameter '${text}'. Value must be exactly '${typeQuery}' (case-sensitive).`
    );
  }
}

export class TimeCallFailure extends Failures {
  constructor() {
    super(400, "TIME_CALL_EXCEEDED", "The web site block request");
  }
}
