"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multipleFilesConfig = exports.multerConfig = exports.MulterConfigService = void 0;
var common_1 = require("@nestjs/common");
var fs_1 = require("fs");
var multer_1 = require("multer");
var path_1 = require("path");
var uuid_1 = require("uuid");
// Ensure upload directory exists
var uploadDir = (0, path_1.join)(process.cwd(), 'uploads');
if (!(0, fs_1.existsSync)(uploadDir)) {
    (0, fs_1.mkdirSync)(uploadDir, { recursive: true });
}
var MulterConfigService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var MulterConfigService = _classThis = /** @class */ (function () {
        function MulterConfigService_1(configService) {
            this.configService = configService;
        }
        MulterConfigService_1.prototype.createMulterOptions = function () {
            var maxFileSize = this.configService.get('MAX_FILE_SIZE', 10485760); // Default 10MB
            return {
                storage: (0, multer_1.diskStorage)({
                    destination: uploadDir,
                    filename: function (req, file, callback) {
                        // Generate a unique filename with original extension
                        var uniqueFilename = "".concat((0, uuid_1.v4)()).concat((0, path_1.extname)(file.originalname));
                        callback(null, uniqueFilename);
                    },
                }),
                fileFilter: function (req, file, callback) {
                    // Check file type
                    if (file.mimetype !== 'application/pdf') {
                        return callback(new common_1.HttpException('Only PDF files are allowed', common_1.HttpStatus.BAD_REQUEST), false);
                    }
                    callback(null, true);
                },
                limits: {
                    fileSize: maxFileSize,
                },
            };
        };
        MulterConfigService_1.prototype.createMultipleFilesOptions = function () {
            var config = this.createMulterOptions();
            var maxFiles = this.configService.get('MAX_FILES', 10);
            return __assign(__assign({}, config), { limits: __assign(__assign({}, config.limits), { files: maxFiles }) });
        };
        return MulterConfigService_1;
    }());
    __setFunctionName(_classThis, "MulterConfigService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MulterConfigService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MulterConfigService = _classThis;
}();
exports.MulterConfigService = MulterConfigService;
// Legacy exports for backward compatibility
exports.multerConfig = {
    storage: (0, multer_1.diskStorage)({
        destination: uploadDir,
        filename: function (req, file, callback) {
            var uniqueFilename = "".concat((0, uuid_1.v4)()).concat((0, path_1.extname)(file.originalname));
            callback(null, uniqueFilename);
        },
    }),
    fileFilter: function (req, file, callback) {
        if (file.mimetype !== 'application/pdf') {
            return callback(new common_1.HttpException('Only PDF files are allowed', common_1.HttpStatus.BAD_REQUEST), false);
        }
        callback(null, true);
    },
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
};
exports.multipleFilesConfig = __assign(__assign({}, exports.multerConfig), { limits: __assign(__assign({}, exports.multerConfig.limits), { files: 10 }) });
