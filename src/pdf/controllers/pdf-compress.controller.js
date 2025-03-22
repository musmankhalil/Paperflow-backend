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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfCompressController = void 0;
var common_1 = require("@nestjs/common");
var platform_express_1 = require("@nestjs/platform-express");
var fs_1 = require("fs");
var multer_config_1 = require("../multer.config");
var compress_options_dto_1 = require("../dto/compress-options.dto");
var swagger_1 = require("@nestjs/swagger");
// Swagger DTO helpers
var FileUploadDto = function () {
    var _a;
    var _file_decorators;
    var _file_initializers = [];
    var _file_extraInitializers = [];
    return _a = /** @class */ (function () {
            function FileUploadDto() {
                this.file = __runInitializers(this, _file_initializers, void 0);
                __runInitializers(this, _file_extraInitializers);
            }
            return FileUploadDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _file_decorators = [(0, swagger_1.ApiProperty)({ type: 'string', format: 'binary' })];
            __esDecorate(null, null, _file_decorators, { kind: "field", name: "file", static: false, private: false, access: { has: function (obj) { return "file" in obj; }, get: function (obj) { return obj.file; }, set: function (obj, value) { obj.file = value; } }, metadata: _metadata }, _file_initializers, _file_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var CompressionResult = function () {
    var _a;
    var _message_decorators;
    var _message_initializers = [];
    var _message_extraInitializers = [];
    var _originalSize_decorators;
    var _originalSize_initializers = [];
    var _originalSize_extraInitializers = [];
    var _compressedSize_decorators;
    var _compressedSize_initializers = [];
    var _compressedSize_extraInitializers = [];
    var _compressionRatio_decorators;
    var _compressionRatio_initializers = [];
    var _compressionRatio_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CompressionResult() {
                this.message = __runInitializers(this, _message_initializers, void 0);
                this.originalSize = (__runInitializers(this, _message_extraInitializers), __runInitializers(this, _originalSize_initializers, void 0));
                this.compressedSize = (__runInitializers(this, _originalSize_extraInitializers), __runInitializers(this, _compressedSize_initializers, void 0));
                this.compressionRatio = (__runInitializers(this, _compressedSize_extraInitializers), __runInitializers(this, _compressionRatio_initializers, void 0));
                __runInitializers(this, _compressionRatio_extraInitializers);
            }
            return CompressionResult;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _message_decorators = [(0, swagger_1.ApiProperty)({ example: 'PDF compressed successfully' })];
            _originalSize_decorators = [(0, swagger_1.ApiProperty)({ example: '1024 KB' })];
            _compressedSize_decorators = [(0, swagger_1.ApiProperty)({ example: '512 KB' })];
            _compressionRatio_decorators = [(0, swagger_1.ApiProperty)({ example: 50 })];
            __esDecorate(null, null, _message_decorators, { kind: "field", name: "message", static: false, private: false, access: { has: function (obj) { return "message" in obj; }, get: function (obj) { return obj.message; }, set: function (obj, value) { obj.message = value; } }, metadata: _metadata }, _message_initializers, _message_extraInitializers);
            __esDecorate(null, null, _originalSize_decorators, { kind: "field", name: "originalSize", static: false, private: false, access: { has: function (obj) { return "originalSize" in obj; }, get: function (obj) { return obj.originalSize; }, set: function (obj, value) { obj.originalSize = value; } }, metadata: _metadata }, _originalSize_initializers, _originalSize_extraInitializers);
            __esDecorate(null, null, _compressedSize_decorators, { kind: "field", name: "compressedSize", static: false, private: false, access: { has: function (obj) { return "compressedSize" in obj; }, get: function (obj) { return obj.compressedSize; }, set: function (obj, value) { obj.compressedSize = value; } }, metadata: _metadata }, _compressedSize_initializers, _compressedSize_extraInitializers);
            __esDecorate(null, null, _compressionRatio_decorators, { kind: "field", name: "compressionRatio", static: false, private: false, access: { has: function (obj) { return "compressionRatio" in obj; }, get: function (obj) { return obj.compressionRatio; }, set: function (obj, value) { obj.compressionRatio = value; } }, metadata: _metadata }, _compressionRatio_initializers, _compressionRatio_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var CompressionAnalysis = function () {
    var _a;
    var _fileSize_decorators;
    var _fileSize_initializers = [];
    var _fileSize_extraInitializers = [];
    var _pageCount_decorators;
    var _pageCount_initializers = [];
    var _pageCount_extraInitializers = [];
    var _hasImages_decorators;
    var _hasImages_initializers = [];
    var _hasImages_extraInitializers = [];
    var _estimatedImageSize_decorators;
    var _estimatedImageSize_initializers = [];
    var _estimatedImageSize_extraInitializers = [];
    var _hasFormFields_decorators;
    var _hasFormFields_initializers = [];
    var _hasFormFields_extraInitializers = [];
    var _recommendations_decorators;
    var _recommendations_initializers = [];
    var _recommendations_extraInitializers = [];
    var _estimatedSavings_decorators;
    var _estimatedSavings_initializers = [];
    var _estimatedSavings_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CompressionAnalysis() {
                this.fileSize = __runInitializers(this, _fileSize_initializers, void 0);
                this.pageCount = (__runInitializers(this, _fileSize_extraInitializers), __runInitializers(this, _pageCount_initializers, void 0));
                this.hasImages = (__runInitializers(this, _pageCount_extraInitializers), __runInitializers(this, _hasImages_initializers, void 0));
                this.estimatedImageSize = (__runInitializers(this, _hasImages_extraInitializers), __runInitializers(this, _estimatedImageSize_initializers, void 0));
                this.hasFormFields = (__runInitializers(this, _estimatedImageSize_extraInitializers), __runInitializers(this, _hasFormFields_initializers, void 0));
                this.recommendations = (__runInitializers(this, _hasFormFields_extraInitializers), __runInitializers(this, _recommendations_initializers, void 0));
                this.estimatedSavings = (__runInitializers(this, _recommendations_extraInitializers), __runInitializers(this, _estimatedSavings_initializers, void 0));
                __runInitializers(this, _estimatedSavings_extraInitializers);
            }
            return CompressionAnalysis;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _fileSize_decorators = [(0, swagger_1.ApiProperty)({ example: '1024 KB' })];
            _pageCount_decorators = [(0, swagger_1.ApiProperty)({ example: 10 })];
            _hasImages_decorators = [(0, swagger_1.ApiProperty)({ example: true })];
            _estimatedImageSize_decorators = [(0, swagger_1.ApiProperty)({ example: '800 KB' })];
            _hasFormFields_decorators = [(0, swagger_1.ApiProperty)({ example: false })];
            _recommendations_decorators = [(0, swagger_1.ApiProperty)({
                    example: [
                        'Apply medium image compression',
                        'Downsample images to 150 DPI',
                        'Remove metadata'
                    ]
                })];
            _estimatedSavings_decorators = [(0, swagger_1.ApiProperty)({ example: '30-40%' })];
            __esDecorate(null, null, _fileSize_decorators, { kind: "field", name: "fileSize", static: false, private: false, access: { has: function (obj) { return "fileSize" in obj; }, get: function (obj) { return obj.fileSize; }, set: function (obj, value) { obj.fileSize = value; } }, metadata: _metadata }, _fileSize_initializers, _fileSize_extraInitializers);
            __esDecorate(null, null, _pageCount_decorators, { kind: "field", name: "pageCount", static: false, private: false, access: { has: function (obj) { return "pageCount" in obj; }, get: function (obj) { return obj.pageCount; }, set: function (obj, value) { obj.pageCount = value; } }, metadata: _metadata }, _pageCount_initializers, _pageCount_extraInitializers);
            __esDecorate(null, null, _hasImages_decorators, { kind: "field", name: "hasImages", static: false, private: false, access: { has: function (obj) { return "hasImages" in obj; }, get: function (obj) { return obj.hasImages; }, set: function (obj, value) { obj.hasImages = value; } }, metadata: _metadata }, _hasImages_initializers, _hasImages_extraInitializers);
            __esDecorate(null, null, _estimatedImageSize_decorators, { kind: "field", name: "estimatedImageSize", static: false, private: false, access: { has: function (obj) { return "estimatedImageSize" in obj; }, get: function (obj) { return obj.estimatedImageSize; }, set: function (obj, value) { obj.estimatedImageSize = value; } }, metadata: _metadata }, _estimatedImageSize_initializers, _estimatedImageSize_extraInitializers);
            __esDecorate(null, null, _hasFormFields_decorators, { kind: "field", name: "hasFormFields", static: false, private: false, access: { has: function (obj) { return "hasFormFields" in obj; }, get: function (obj) { return obj.hasFormFields; }, set: function (obj, value) { obj.hasFormFields = value; } }, metadata: _metadata }, _hasFormFields_initializers, _hasFormFields_extraInitializers);
            __esDecorate(null, null, _recommendations_decorators, { kind: "field", name: "recommendations", static: false, private: false, access: { has: function (obj) { return "recommendations" in obj; }, get: function (obj) { return obj.recommendations; }, set: function (obj, value) { obj.recommendations = value; } }, metadata: _metadata }, _recommendations_initializers, _recommendations_extraInitializers);
            __esDecorate(null, null, _estimatedSavings_decorators, { kind: "field", name: "estimatedSavings", static: false, private: false, access: { has: function (obj) { return "estimatedSavings" in obj; }, get: function (obj) { return obj.estimatedSavings; }, set: function (obj, value) { obj.estimatedSavings = value; } }, metadata: _metadata }, _estimatedSavings_initializers, _estimatedSavings_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var PdfCompressController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('pdf-compress'), (0, common_1.Controller)('pdf/compress')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _compressPdf_decorators;
    var _analyzePdfCompression_decorators;
    var PdfCompressController = _classThis = /** @class */ (function () {
        function PdfCompressController_1(pdfService) {
            this.pdfService = (__runInitializers(this, _instanceExtraInitializers), pdfService);
        }
        /**
         * Compress a PDF file to reduce size
         */
        PdfCompressController_1.prototype.compressPdf = function (file, compressOptionsDto, infoOnly, res) {
            return __awaiter(this, void 0, void 0, function () {
                var originalFileStats, originalSizeKb, compressedPdfPath_1, compressedFileStats, compressedSizeKb, compressionRatio, fileStream, error_1;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!file) {
                                throw new common_1.HttpException('No file uploaded', common_1.HttpStatus.BAD_REQUEST);
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            originalFileStats = (0, fs_1.statSync)(file.path);
                            originalSizeKb = Math.round(originalFileStats.size / 1024);
                            return [4 /*yield*/, this.pdfService.compressPdf(file.path, compressOptionsDto)];
                        case 2:
                            compressedPdfPath_1 = _a.sent();
                            compressedFileStats = (0, fs_1.statSync)(compressedPdfPath_1);
                            compressedSizeKb = Math.round(compressedFileStats.size / 1024);
                            compressionRatio = Math.round((1 - (compressedFileStats.size / originalFileStats.size)) * 100);
                            // Return JSON info if requested
                            if (infoOnly) {
                                res.setHeader('Content-Type', 'application/json');
                                res.json({
                                    message: 'PDF compressed successfully',
                                    originalSize: "".concat(originalSizeKb, " KB"),
                                    compressedSize: "".concat(compressedSizeKb, " KB"),
                                    compressionRatio: compressionRatio,
                                    originalFilename: file.originalname,
                                });
                                // Clean up files after sending the response
                                this.pdfService.cleanupFile(compressedPdfPath_1);
                                this.pdfService.cleanupFile(file.path);
                            }
                            else {
                                // Stream the compressed PDF as response
                                res.setHeader('Content-Type', 'application/pdf');
                                res.setHeader('Content-Disposition', "attachment; filename=\"compressed-".concat(file.originalname || 'document.pdf', "\""));
                                fileStream = (0, fs_1.createReadStream)(compressedPdfPath_1);
                                fileStream.pipe(res);
                                // Clean up after streaming
                                fileStream.on('end', function () {
                                    _this.pdfService.cleanupFile(compressedPdfPath_1);
                                    _this.pdfService.cleanupFile(file.path);
                                });
                            }
                            return [3 /*break*/, 4];
                        case 3:
                            error_1 = _a.sent();
                            // Clean up on error
                            if (file && file.path) {
                                this.pdfService.cleanupFile(file.path);
                            }
                            throw error_1;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Analyze a PDF file and provide compression recommendations
         */
        PdfCompressController_1.prototype.analyzePdfCompression = function (file, res) {
            return __awaiter(this, void 0, void 0, function () {
                var fileStats, fileSizeKb, analysis, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!file) {
                                throw new common_1.HttpException('No file uploaded', common_1.HttpStatus.BAD_REQUEST);
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            fileStats = (0, fs_1.statSync)(file.path);
                            fileSizeKb = Math.round(fileStats.size / 1024);
                            return [4 /*yield*/, this.pdfService.analyzePdfCompression(file.path)];
                        case 2:
                            analysis = _a.sent();
                            // Return analysis
                            res.json({
                                fileSize: "".concat(fileSizeKb, " KB"),
                                pageCount: analysis.pageCount,
                                hasImages: analysis.hasImages || false,
                                estimatedImageSize: analysis.estimatedImageSize || 'Unknown',
                                hasFormFields: analysis.hasFormFields || false,
                                recommendations: analysis.recommendations || [],
                                estimatedSavings: "".concat(analysis.potentialSavings || 0, "-").concat(Math.min(analysis.potentialSavings + 10 || 5, 95), "%"),
                                metadata: analysis.hasMetadata ? 'Present' : 'None detected'
                            });
                            // Clean up
                            this.pdfService.cleanupFile(file.path);
                            return [3 /*break*/, 4];
                        case 3:
                            error_2 = _a.sent();
                            // Clean up on error
                            if (file && file.path) {
                                this.pdfService.cleanupFile(file.path);
                            }
                            throw error_2;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        return PdfCompressController_1;
    }());
    __setFunctionName(_classThis, "PdfCompressController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _compressPdf_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiOperation)({
                summary: 'Compress a PDF file to reduce file size',
                description: 'Compresses PDF using various techniques including image compression, downsampling, and metadata removal.'
            }), (0, swagger_1.ApiConsumes)('multipart/form-data'), (0, swagger_1.ApiBody)({
                description: 'PDF file to compress with options',
                schema: {
                    type: 'object',
                    required: ['file'],
                    properties: {
                        file: {
                            type: 'string',
                            format: 'binary',
                        },
                        imageCompression: {
                            type: 'string',
                            enum: Object.values(compress_options_dto_1.ImageCompressionLevel),
                            default: compress_options_dto_1.ImageCompressionLevel.MEDIUM,
                            description: 'Image compression level to apply',
                        },
                        imageQuality: {
                            type: 'number',
                            minimum: 1,
                            maximum: 100,
                            default: 75,
                            description: 'JPEG image quality (1-100, lower means more compression)',
                        },
                        downsampleImages: {
                            type: 'boolean',
                            default: true,
                            description: 'Whether to downsample images to reduce file size',
                        },
                        downsampleDpi: {
                            type: 'number',
                            minimum: 72,
                            maximum: 300,
                            default: 150,
                            description: 'Target DPI for downsampled images',
                        },
                        removeMetadata: {
                            type: 'boolean',
                            default: false,
                            description: 'Whether to remove metadata to reduce file size',
                        },
                        flattenFormFields: {
                            type: 'boolean',
                            default: false,
                            description: 'Whether to flatten form fields',
                        },
                        deduplicateImages: {
                            type: 'boolean',
                            default: true,
                            description: 'Whether to combine duplicate image resources',
                        }
                    },
                },
            }), (0, swagger_1.ApiProduces)('application/pdf', 'application/json'), (0, swagger_1.ApiQuery)({
                name: 'info',
                required: false,
                type: Boolean,
                description: 'If true, returns compression info as JSON instead of the PDF file'
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                content: {
                    'application/pdf': {
                        schema: {
                            type: 'string',
                            format: 'binary',
                        }
                    },
                    'application/json': {
                        schema: { $ref: (0, swagger_1.getSchemaPath)(CompressionResult) }
                    }
                }
            }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input or no file uploaded' }), (0, swagger_1.ApiResponse)({ status: 500, description: 'Failed to compress PDF' }), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multer_config_1.multerConfig))];
        _analyzePdfCompression_decorators = [(0, common_1.Post)('analyze'), (0, swagger_1.ApiOperation)({
                summary: 'Analyze a PDF file and provide compression recommendations',
                description: 'Analyzes PDF structure and suggests optimizations that could reduce file size.'
            }), (0, swagger_1.ApiConsumes)('multipart/form-data'), (0, swagger_1.ApiBody)({
                description: 'PDF file to analyze',
                type: FileUploadDto,
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'PDF analysis complete',
                type: CompressionAnalysis,
            }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input or no file uploaded' }), (0, swagger_1.ApiResponse)({ status: 500, description: 'Failed to analyze PDF' }), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multer_config_1.multerConfig))];
        __esDecorate(_classThis, null, _compressPdf_decorators, { kind: "method", name: "compressPdf", static: false, private: false, access: { has: function (obj) { return "compressPdf" in obj; }, get: function (obj) { return obj.compressPdf; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _analyzePdfCompression_decorators, { kind: "method", name: "analyzePdfCompression", static: false, private: false, access: { has: function (obj) { return "analyzePdfCompression" in obj; }, get: function (obj) { return obj.analyzePdfCompression; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PdfCompressController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PdfCompressController = _classThis;
}();
exports.PdfCompressController = PdfCompressController;
