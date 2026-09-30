import { BadRequestException } from '@nestjs/common';
import { GradeType } from '@prisma/client';

export const GRADE_MIN = 1;
export const GRADE_MAX = 10;

/** Grade value stored for a pass/fail ("зачёт / не зачёт") result */
export const CREDIT_PASSED = 1;
export const CREDIT_FAILED = 0;

/** Types graded as pass/fail instead of 1-10 */
export const PASS_FAIL_TYPES: GradeType[] = [GradeType.CREDIT];

/**
 * Assert that a grade value is valid for its type:
 * pass/fail types accept 0 (not passed) or 1 (passed), all others an integer 1-10
 * @throws BadRequestException if the value is not allowed for the type
 */
export function assertGradeValue(gradeType: GradeType, gradeValue: number): void {
  if (PASS_FAIL_TYPES.includes(gradeType)) {
    if (gradeValue !== CREDIT_PASSED && gradeValue !== CREDIT_FAILED) {
      throw new BadRequestException(
        `Grade type ${gradeType} accepts only ${CREDIT_FAILED} (not passed) or ${CREDIT_PASSED} (passed)`,
      );
    }
    return;
  }

  if (gradeValue < GRADE_MIN || gradeValue > GRADE_MAX) {
    throw new BadRequestException(
      `Grade type ${gradeType} accepts values from ${GRADE_MIN} to ${GRADE_MAX}`,
    );
  }
}
