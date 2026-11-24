import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";
import { DomainError } from "./shared/domain-error.js";

// Like app/Exceptions/Handler.php: turns errors into clear JSON answers.
export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  // The body or query has the wrong shape (missing field, text instead of number...).
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.code(400).send({
      error: "Bad Request",
      message: "The request is not valid",
      issues: error.validation.map((issue) => ({
        path: issue.instancePath,
        message: issue.message,
      })),
    });
  }

  // The shape is fine but a business rule says no (unknown package, bad plate...).
  if (error instanceof DomainError) {
    return reply.code(422).send({ error: "Unprocessable Entity", message: error.message });
  }

  const statusCode = error.statusCode ?? 500;
  if (statusCode >= 500) {
    request.log.error(error);
    return reply
      .code(500)
      .send({ error: "Internal Server Error", message: "Something went wrong" });
  }

  return reply.code(statusCode).send({ error: error.name, message: error.message });
}
