"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergeOptionsDto = void 0;
var class_validator_1 = require("class-validator");
var class_transformer_1 = require("class-transformer");
var swagger_1 = require("@nestjs/swagger");
var DocumentInfoDto = function () {
    var _a;
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _author_decorators;
    var _author_initializers = [];
    var _author_extraInitializers = [];
    var _subject_decorators;
    var _subject_initializers = [];
    var _subject_extraInitializers = [];
    var _keywords_decorators;
    var _keywords_initializers = [];
    var _keywords_extraInitializers = [];
    return _a = /** @class */ (function () {
            function DocumentInfoDto() {
                this.title = __runInitializers(this, _title_initializers, void 0);
                this.author = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _author_initializers, void 0));
                this.subject = (__runInitializers(this, _author_extraInitializers), __runInitializers(this, _subject_initializers, void 0));
                this.keywords = (__runInitializers(this, _subject_extraInitializers), __runInitializers(this, _keywords_initializers, void 0));
                __runInitializers(this, _keywords_extraInitializers);
            }
            return DocumentInfoDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Title of the merged PDF document',
                    example: 'Merged Document',
                    required: false
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _author_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Author of the merged PDF document',
                    example: 'PaperFlow API',
                    required: false
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _subject_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Subject of the merged PDF document',
                    example: 'Merged PDFs',
                    required: false
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _keywords_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Keywords for the merged PDF document',
                    example: 'merged, combined, pdf, documents',
                    required: false
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _author_decorators, { kind: "field", name: "author", static: false, private: false, access: { has: function (obj) { return "author" in obj; }, get: function (obj) { return obj.author; }, set: function (obj, value) { obj.author = value; } }, metadata: _metadata }, _author_initializers, _author_extraInitializers);
            __esDecorate(null, null, _subject_decorators, { kind: "field", name: "subject", static: false, private: false, access: { has: function (obj) { return "subject" in obj; }, get: function (obj) { return obj.subject; }, set: function (obj, value) { obj.subject = value; } }, metadata: _metadata }, _subject_initializers, _subject_extraInitializers);
            __esDecorate(null, null, _keywords_decorators, { kind: "field", name: "keywords", static: false, private: false, access: { has: function (obj) { return "keywords" in obj; }, get: function (obj) { return obj.keywords; }, set: function (obj, value) { obj.keywords = value; } }, metadata: _metadata }, _keywords_initializers, _keywords_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var BookmarkDto = function () {
    var _a;
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _pageNumber_decorators;
    var _pageNumber_initializers = [];
    var _pageNumber_extraInitializers = [];
    return _a = /** @class */ (function () {
            function BookmarkDto() {
                this.title = __runInitializers(this, _title_initializers, void 0);
                this.pageNumber = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _pageNumber_initializers, void 0));
                __runInitializers(this, _pageNumber_extraInitializers);
            }
            return BookmarkDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Title of the bookmark',
                    example: 'Document 1'
                }), (0, class_validator_1.IsString)()];
            _pageNumber_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Page number that this bookmark should point to (1-based)',
                    example: 1
                }), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _pageNumber_decorators, { kind: "field", name: "pageNumber", static: false, private: false, access: { has: function (obj) { return "pageNumber" in obj; }, get: function (obj) { return obj.pageNumber; }, set: function (obj, value) { obj.pageNumber = value; } }, metadata: _metadata }, _pageNumber_initializers, _pageNumber_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var MergeOptionsDto = function () {
    var _a;
    var _documentInfo_decorators;
    var _documentInfo_initializers = [];
    var _documentInfo_extraInitializers = [];
    var _addBookmarks_decorators;
    var _addBookmarks_initializers = [];
    var _addBookmarks_extraInitializers = [];
    var _bookmarks_decorators;
    var _bookmarks_initializers = [];
    var _bookmarks_extraInitializers = [];
    var _fileOrder_decorators;
    var _fileOrder_initializers = [];
    var _fileOrder_extraInitializers = [];
    return _a = /** @class */ (function () {
            function MergeOptionsDto() {
                this.documentInfo = __runInitializers(this, _documentInfo_initializers, void 0);
                this.addBookmarks = (__runInitializers(this, _documentInfo_extraInitializers), __runInitializers(this, _addBookmarks_initializers, void 0));
                this.bookmarks = (__runInitializers(this, _addBookmarks_extraInitializers), __runInitializers(this, _bookmarks_initializers, void 0));
                this.fileOrder = (__runInitializers(this, _bookmarks_extraInitializers), __runInitializers(this, _fileOrder_initializers, void 0));
                __runInitializers(this, _fileOrder_extraInitializers);
            }
            return MergeOptionsDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _documentInfo_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Information to set on the merged document',
                    required: false,
                    type: DocumentInfoDto
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(function () { return DocumentInfoDto; })];
            _addBookmarks_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Whether to add bookmarks for each merged document',
                    example: true,
                    required: false,
                    default: false
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _bookmarks_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Custom bookmarks to add to the document',
                    type: [BookmarkDto],
                    required: false
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(function () { return BookmarkDto; })];
            _fileOrder_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Array of file indices indicating the order in which to merge the files (0-based)',
                    example: [0, 2, 1],
                    required: false
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)()];
            __esDecorate(null, null, _documentInfo_decorators, { kind: "field", name: "documentInfo", static: false, private: false, access: { has: function (obj) { return "documentInfo" in obj; }, get: function (obj) { return obj.documentInfo; }, set: function (obj, value) { obj.documentInfo = value; } }, metadata: _metadata }, _documentInfo_initializers, _documentInfo_extraInitializers);
            __esDecorate(null, null, _addBookmarks_decorators, { kind: "field", name: "addBookmarks", static: false, private: false, access: { has: function (obj) { return "addBookmarks" in obj; }, get: function (obj) { return obj.addBookmarks; }, set: function (obj, value) { obj.addBookmarks = value; } }, metadata: _metadata }, _addBookmarks_initializers, _addBookmarks_extraInitializers);
            __esDecorate(null, null, _bookmarks_decorators, { kind: "field", name: "bookmarks", static: false, private: false, access: { has: function (obj) { return "bookmarks" in obj; }, get: function (obj) { return obj.bookmarks; }, set: function (obj, value) { obj.bookmarks = value; } }, metadata: _metadata }, _bookmarks_initializers, _bookmarks_extraInitializers);
            __esDecorate(null, null, _fileOrder_decorators, { kind: "field", name: "fileOrder", static: false, private: false, access: { has: function (obj) { return "fileOrder" in obj; }, get: function (obj) { return obj.fileOrder; }, set: function (obj, value) { obj.fileOrder = value; } }, metadata: _metadata }, _fileOrder_initializers, _fileOrder_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.MergeOptionsDto = MergeOptionsDto;
