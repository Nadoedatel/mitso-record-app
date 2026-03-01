"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSubjectDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_subject_dto_1 = require("./create-subject.dto");
class UpdateSubjectDto extends (0, mapped_types_1.PartialType)(create_subject_dto_1.CreateSubjectDto) {
}
exports.UpdateSubjectDto = UpdateSubjectDto;
//# sourceMappingURL=update-subject.dto.js.map