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
exports.CompressOptionsDto = exports.ImageCompressionLevel = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var ImageCompressionLevel;
(function (ImageCompressionLevel) {
    ImageCompressionLevel["NONE"] = "none";
    ImageCompressionLevel["LOW"] = "low";
    ImageCompressionLevel["MEDIUM"] = "medium";
    ImageCompressionLevel["HIGH"] = "high";
})(ImageCompressionLevel || (exports.ImageCompressionLevel = ImageCompressionLevel = {}));
var CompressOptionsDto = function () {
    var _a;
    var _imageCompression_decorators;
    var _imageCompression_initializers = [];
    var _imageCompression_extraInitializers = [];
    var _imageQuality_decorators;
    var _imageQuality_initializers = [];
    var _imageQuality_extraInitializers = [];
    var _downsampleImages_decorators;
    var _downsampleImages_initializers = [];
    var _downsampleImages_extraInitializers = [];
    var _downsampleDpi_decorators;
    var _downsampleDpi_initializers = [];
    var _downsampleDpi_extraInitializers = [];
    var _removeMetadata_decorators;
    var _removeMetadata_initializers = [];
    var _removeMetadata_extraInitializers = [];
    var _flattenFormFields_decorators;
    var _flattenFormFields_initializers = [];
    var _flattenFormFields_extraInitializers = [];
    var _deduplicateImages_decorators;
    var _deduplicateImages_initializers = [];
    var _deduplicateImages_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CompressOptionsDto() {
                this.imageCompression = __runInitializers(this, _imageCompression_initializers, void 0);
                this.imageQuality = (__runInitializers(this, _imageCompression_extraInitializers), __runInitializers(this, _imageQuality_initializers, void 0));
                this.downsampleImages = (__runInitializers(this, _imageQuality_extraInitializers), __runInitializers(this, _downsampleImages_initializers, void 0));
                this.downsampleDpi = (__runInitializers(this, _downsampleImages_extraInitializers), __runInitializers(this, _downsampleDpi_initializers, void 0));
                this.removeMetadata = (__runInitializers(this, _downsampleDpi_extraInitializers), __runInitializers(this, _removeMetadata_initializers, void 0));
                this.flattenFormFields = (__runInitializers(this, _removeMetadata_extraInitializers), __runInitializers(this, _flattenFormFields_initializers, void 0));
                this.deduplicateImages = (__runInitializers(this, _flattenFormFields_extraInitializers), __runInitializers(this, _deduplicateImages_initializers, void 0));
                __runInitializers(this, _deduplicateImages_extraInitializers);
            }
            return CompressOptionsDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _imageCompression_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Image compression level to apply',
                    enum: ImageCompressionLevel,
                    default: ImageCompressionLevel.MEDIUM,
                    required: true
                }), (0, class_validator_1.IsEnum)(ImageCompressionLevel)];
            _imageQuality_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'JPEG image quality (1-100, lower means more compression)',
                    default: 75,
                    required: true
                }), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(100)];
            _downsampleImages_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Whether to downsample images to reduce file size',
                    default: true,
                    required: false
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _downsampleDpi_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Target DPI for downsampled images (72-300)',
                    default: 150,
                    required: false
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(72), (0, class_validator_1.Max)(300)];
            _removeMetadata_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Whether to remove metadata to reduce file size',
                    default: false,
                    required: false
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _flattenFormFields_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Whether to flatten form fields',
                    default: false,
                    required: false
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _deduplicateImages_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Whether to combine duplicate image resources',
                    default: true,
                    required: false
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _imageCompression_decorators, { kind: "field", name: "imageCompression", static: false, private: false, access: { has: function (obj) { return "imageCompression" in obj; }, get: function (obj) { return obj.imageCompression; }, set: function (obj, value) { obj.imageCompression = value; } }, metadata: _metadata }, _imageCompression_initializers, _imageCompression_extraInitializers);
            __esDecorate(null, null, _imageQuality_decorators, { kind: "field", name: "imageQuality", static: false, private: false, access: { has: function (obj) { return "imageQuality" in obj; }, get: function (obj) { return obj.imageQuality; }, set: function (obj, value) { obj.imageQuality = value; } }, metadata: _metadata }, _imageQuality_initializers, _imageQuality_extraInitializers);
            __esDecorate(null, null, _downsampleImages_decorators, { kind: "field", name: "downsampleImages", static: false, private: false, access: { has: function (obj) { return "downsampleImages" in obj; }, get: function (obj) { return obj.downsampleImages; }, set: function (obj, value) { obj.downsampleImages = value; } }, metadata: _metadata }, _downsampleImages_initializers, _downsampleImages_extraInitializers);
            __esDecorate(null, null, _downsampleDpi_decorators, { kind: "field", name: "downsampleDpi", static: false, private: false, access: { has: function (obj) { return "downsampleDpi" in obj; }, get: function (obj) { return obj.downsampleDpi; }, set: function (obj, value) { obj.downsampleDpi = value; } }, metadata: _metadata }, _downsampleDpi_initializers, _downsampleDpi_extraInitializers);
            __esDecorate(null, null, _removeMetadata_decorators, { kind: "field", name: "removeMetadata", static: false, private: false, access: { has: function (obj) { return "removeMetadata" in obj; }, get: function (obj) { return obj.removeMetadata; }, set: function (obj, value) { obj.removeMetadata = value; } }, metadata: _metadata }, _removeMetadata_initializers, _removeMetadata_extraInitializers);
            __esDecorate(null, null, _flattenFormFields_decorators, { kind: "field", name: "flattenFormFields", static: false, private: false, access: { has: function (obj) { return "flattenFormFields" in obj; }, get: function (obj) { return obj.flattenFormFields; }, set: function (obj, value) { obj.flattenFormFields = value; } }, metadata: _metadata }, _flattenFormFields_initializers, _flattenFormFields_extraInitializers);
            __esDecorate(null, null, _deduplicateImages_decorators, { kind: "field", name: "deduplicateImages", static: false, private: false, access: { has: function (obj) { return "deduplicateImages" in obj; }, get: function (obj) { return obj.deduplicateImages; }, set: function (obj, value) { obj.deduplicateImages = value; } }, metadata: _metadata }, _deduplicateImages_initializers, _deduplicateImages_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CompressOptionsDto = CompressOptionsDto;
