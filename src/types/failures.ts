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

export class QueryItemFailure extends Failures {
  constructor(text: string, itemText: string) {
    super(
      400,
      "MISSING_PARAMETER",
      `Item :${itemText}, The request is missing the required ${text} parameter`
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

export class QueryTypeItemFailure extends Failures {
  constructor(text: string, typeQuery: string, itemText: string) {
    super(
      400,
      "WRONG_PARAMETER",
      `Item :${itemText}, Invalid parameter '${text}'. Value must be exactly '${typeQuery}' (case-sensitive).`
    );
  }
}

export class QueryListFailure extends Failures {
  constructor() {
    super(400, "WRONG_PARAMETER", `You must provide a valid list of traffic.`);
  }
}

export class QueryDateFailure extends Failures {
  constructor(text: string) {
    super(
      400,
      "WRONG_PARAMETER",
      `Invalid parameter '${text}'. Value must be exactly format YYYYMMDD (case-sensitive).`
    );
  }
}

export class TimeCallFailure extends Failures {
  constructor() {
    super(400, "TIME_CALL_EXCEEDED", "The web site block request");
  }
}

export class InsertFailure extends Failures {
  constructor(text: string) {
    super(
      400,
      "INSERT_FAILURE",
      `Unable to insert ${text}. Invalid or missing data.`
    );
  }
}

export class SearchFailure extends Failures {
  constructor(text: string) {
    super(
      400,
      "SEARCH_FAILURE",
      `Unable to find ${text}. Invalid or missing data.`
    );
  }
}
