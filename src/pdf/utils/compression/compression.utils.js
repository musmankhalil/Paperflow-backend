"use strict";
/**
 * PDF Compression Utilities
 *
 * These utilities help optimize PDF files for reduced file size.
 * Note: Full implementation of advanced compression techniques would require
 * additional libraries that can directly manipulate PDF content and images.
 */
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompressionStats = exports.applyBasicCompression = exports.analyzePdfForCompression = exports.calculateCompressionSettings = void 0;
var pdf_lib_1 = require("pdf-lib");
var fs = require("fs");
var compress_options_dto_1 = require("../../dto/compress-options.dto");
/**
 * Calculate optimal compression settings based on the input file and options
 */
var calculateCompressionSettings = function (fileSize, pageCount, compressionLevel) {
    // Default settings
    var settings = {
        useObjectStreams: true,
        objectsPerTick: 100,
        // These properties are for documentation purposes
        // actual implementation would use specialized libraries to:
        // - Extract images
        // - Resize/compress them
        // - Replace them in the PDF
        imageQuality: 75,
        downsampleDpi: 150,
        deduplicateResources: true
    };
    // Adjust settings based on compression level
    switch (compressionLevel) {
        case compress_options_dto_1.ImageCompressionLevel.LOW:
            settings.imageQuality = 85;
            settings.downsampleDpi = 200;
            break;
        case compress_options_dto_1.ImageCompressionLevel.MEDIUM:
            settings.imageQuality = 75;
            settings.downsampleDpi = 150;
            break;
        case compress_options_dto_1.ImageCompressionLevel.HIGH:
            settings.imageQuality = 60;
            settings.downsampleDpi = 100;
            break;
        case compress_options_dto_1.ImageCompressionLevel.NONE:
        default:
            settings.imageQuality = 100;
            settings.downsampleDpi = 300;
            settings.deduplicateResources = false;
            break;
    }
    // Adjust settings based on file size and page count
    if (fileSize > 10 * 1024 * 1024) { // Files larger than 10MB
        // Larger files may need more aggressive compression
        settings.imageQuality -= 5;
        settings.downsampleDpi -= 25;
    }
    if (pageCount > 50) {
        // For documents with many pages, we can process more objects per tick
        settings.objectsPerTick = 200;
    }
    return settings;
};
exports.calculateCompressionSettings = calculateCompressionSettings;
/**
 * Analyze a PDF file to identify compression opportunities
 *
 * @param filePath Path to the PDF file
 * @returns Analysis results including recommendations
 */
var analyzePdfForCompression = function (filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var fileStats, fileSize, pdfBytes, pdfDoc, pageCount, avgPageSize, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fileStats = fs.statSync(filePath);
                fileSize = fileStats.size;
                pdfBytes = fs.readFileSync(filePath);
                return [4 /*yield*/, pdf_lib_1.PDFDocument.load(pdfBytes)];
            case 1:
                pdfDoc = _a.sent();
                pageCount = pdfDoc.getPageCount();
                avgPageSize = fileSize / pageCount;
                result = {
                    fileSize: fileSize,
                    fileSizeKB: Math.round(fileSize / 1024),
                    pageCount: pageCount,
                    avgPageSizeKB: Math.round(avgPageSize / 1024),
                    potentialSavings: 0,
                    recommendations: []
                };
                // Make simple recommendations based on file size
                if (avgPageSize > 500 * 1024) { // > 500KB per page
                    result.recommendations.push('Use high compression level for significant size reduction');
                    result.potentialSavings += 30;
                }
                else if (avgPageSize > 200 * 1024) { // > 200KB per page
                    result.recommendations.push('Use medium compression level for good balance of quality and size');
                    result.potentialSavings += 20;
                }
                else if (avgPageSize > 100 * 1024) { // > 100KB per page
                    result.recommendations.push('Use low compression level to maintain high quality');
                    result.potentialSavings += 10;
                }
                if (fileSize > 5 * 1024 * 1024 && pageCount > 20) {
                    result.recommendations.push('Consider downsampling images to 150 DPI for web viewing');
                    result.potentialSavings += 15;
                }
                if (fileSize > 2 * 1024 * 1024) {
                    result.recommendations.push('Enable resource deduplication to eliminate redundant content');
                    result.potentialSavings += 5;
                }
                // Round potential savings to nearest 5%
                result.potentialSavings = Math.min(95, Math.round(result.potentialSavings / 5) * 5);
                return [2 /*return*/, result];
        }
    });
}); };
exports.analyzePdfForCompression = analyzePdfForCompression;
/**
 * Apply basic compression to a PDF document
 *
 * Note: This is a simplified implementation that relies on pdf-lib's built-in
 * capabilities. For more advanced compression, additional libraries would be needed.
 *
 * @param pdfDoc PDF document to compress
 * @param options Compression options
 * @returns Compressed PDF document
 */
var applyBasicCompression = function (pdfDoc_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([pdfDoc_1], args_1, true), void 0, function (pdfDoc, options) {
        var _a, imageCompression, _b, removeMetadata, _c, deduplicateImages, newDoc, pageCount, i, page, title, author, subject, keywords, rawKeywords, e_1, creator, producer, settings, compressionOptions;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = options.imageCompression, imageCompression = _a === void 0 ? compress_options_dto_1.ImageCompressionLevel.MEDIUM : _a, _b = options.removeMetadata, removeMetadata = _b === void 0 ? false : _b, _c = options.deduplicateImages, deduplicateImages = _c === void 0 ? true : _c;
                    return [4 /*yield*/, pdf_lib_1.PDFDocument.create()];
                case 1:
                    newDoc = _d.sent();
                    pageCount = pdfDoc.getPageCount();
                    i = 0;
                    _d.label = 2;
                case 2:
                    if (!(i < pageCount)) return [3 /*break*/, 5];
                    return [4 /*yield*/, newDoc.copyPages(pdfDoc, [i])];
                case 3:
                    page = (_d.sent())[0];
                    newDoc.addPage(page);
                    _d.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5:
                    if (!removeMetadata) return [3 /*break*/, 6];
                    newDoc.setTitle('');
                    newDoc.setAuthor('');
                    newDoc.setSubject('');
                    newDoc.setKeywords([]);
                    newDoc.setCreator('');
                    newDoc.setProducer('');
                    return [3 /*break*/, 16];
                case 6: return [4 /*yield*/, pdfDoc.getTitle()];
                case 7:
                    title = _d.sent();
                    return [4 /*yield*/, pdfDoc.getAuthor()];
                case 8:
                    author = _d.sent();
                    return [4 /*yield*/, pdfDoc.getSubject()];
                case 9:
                    subject = _d.sent();
                    keywords = [];
                    _d.label = 10;
                case 10:
                    _d.trys.push([10, 12, , 13]);
                    return [4 /*yield*/, pdfDoc.getKeywords()];
                case 11:
                    rawKeywords = _d.sent();
                    if (Array.isArray(rawKeywords)) {
                        keywords = rawKeywords;
                    }
                    else if (typeof rawKeywords === 'string' && rawKeywords.length > 0) {
                        // If it's a string, split it into an array
                        keywords = rawKeywords.split(',').map(function (k) { return k.trim(); });
                    }
                    return [3 /*break*/, 13];
                case 12:
                    e_1 = _d.sent();
                    console.log('Error getting keywords:', e_1);
                    return [3 /*break*/, 13];
                case 13: return [4 /*yield*/, pdfDoc.getCreator()];
                case 14:
                    creator = _d.sent();
                    return [4 /*yield*/, pdfDoc.getProducer()];
                case 15:
                    producer = _d.sent();
                    if (title)
                        newDoc.setTitle(title);
                    if (author)
                        newDoc.setAuthor(author);
                    if (subject)
                        newDoc.setSubject(subject);
                    if (keywords && keywords.length > 0)
                        newDoc.setKeywords(keywords);
                    if (creator)
                        newDoc.setCreator(creator);
                    if (producer)
                        newDoc.setProducer(producer);
                    _d.label = 16;
                case 16:
                    settings = (0, exports.calculateCompressionSettings)(
                    // Simplified - estimating file size based on document structure
                    newDoc.context.largestObjectNumber * 500, pageCount, imageCompression);
                    compressionOptions = {
                        useObjectStreams: true,
                        objectsPerTick: settings.objectsPerTick,
                        addDefaultPage: false,
                    };
                    return [2 /*return*/, newDoc];
            }
        });
    });
};
exports.applyBasicCompression = applyBasicCompression;
/**
 * Compare original and compressed PDFs to report compression results
 *
 * @param originalPath Path to the original PDF
 * @param compressedPath Path to the compressed PDF
 * @returns Compression statistics
 */
var getCompressionStats = function (originalPath, compressedPath) {
    var originalSize = fs.statSync(originalPath).size;
    var compressedSize = fs.statSync(compressedPath).size;
    var sizeReduction = originalSize - compressedSize;
    var percentReduction = Math.round((sizeReduction / originalSize) * 100);
    return {
        originalSize: originalSize,
        originalSizeKB: Math.round(originalSize / 1024),
        compressedSize: compressedSize,
        compressedSizeKB: Math.round(compressedSize / 1024),
        sizeReduction: sizeReduction,
        sizeReductionKB: Math.round(sizeReduction / 1024),
        percentReduction: percentReduction,
    };
};
exports.getCompressionStats = getCompressionStats;
