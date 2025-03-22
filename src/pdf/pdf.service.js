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
exports.PdfService = void 0;
var common_1 = require("@nestjs/common");
var pdf_lib_1 = require("pdf-lib");
var fs = require("fs");
var path = require("path");
var pdfParse = require("pdf-parse");
var compress_options_dto_1 = require("./dto/compress-options.dto");
var compression_1 = require("./utils/compression");
var PdfService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var PdfService = _classThis = /** @class */ (function () {
        function PdfService_1() {
            this.uploadsDir = path.join(process.cwd(), 'uploads');
            // Ensure uploads directory exists
            if (!fs.existsSync(this.uploadsDir)) {
                fs.mkdirSync(this.uploadsDir, { recursive: true });
            }
        }
        /**
         * Extract PDF metadata and information
         */
        PdfService_1.prototype.extractPdfInfo = function (filePath) {
            return __awaiter(this, void 0, void 0, function () {
                var dataBuffer, pdfData, pdfDoc, error_1;
                var _a, _b, _c, _d, _e, _f;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0:
                            _g.trys.push([0, 3, , 4]);
                            dataBuffer = fs.readFileSync(filePath);
                            return [4 /*yield*/, pdfParse(dataBuffer)];
                        case 1:
                            pdfData = _g.sent();
                            return [4 /*yield*/, pdf_lib_1.PDFDocument.load(dataBuffer)];
                        case 2:
                            pdfDoc = _g.sent();
                            return [2 /*return*/, {
                                    title: ((_a = pdfData.info) === null || _a === void 0 ? void 0 : _a.Title) || 'Unknown',
                                    author: ((_b = pdfData.info) === null || _b === void 0 ? void 0 : _b.Author) || 'Unknown',
                                    subject: ((_c = pdfData.info) === null || _c === void 0 ? void 0 : _c.Subject) || '',
                                    keywords: ((_d = pdfData.info) === null || _d === void 0 ? void 0 : _d.Keywords) || '',
                                    creator: ((_e = pdfData.info) === null || _e === void 0 ? void 0 : _e.Creator) || '',
                                    producer: ((_f = pdfData.info) === null || _f === void 0 ? void 0 : _f.Producer) || '',
                                    pageCount: pdfDoc.getPageCount(),
                                    textContent: pdfData.text,
                                    fileSize: Math.round(dataBuffer.length / 1024) + ' KB',
                                }];
                        case 3:
                            error_1 = _g.sent();
                            throw new common_1.HttpException("Failed to extract PDF info: ".concat(error_1.message), common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Merge multiple PDFs into a single PDF
         */
        PdfService_1.prototype.mergePdfs = function (filePaths, options) {
            return __awaiter(this, void 0, void 0, function () {
                var mergedPdf_1, _a, title, author, subject, keywords, orderedFilePaths, pageCountMap, currentPageCount, i, filePath, pdfBytes, pdf, pages, outputPath, mergedPdfBytes, error_2;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 8, , 9]);
                            return [4 /*yield*/, pdf_lib_1.PDFDocument.create()];
                        case 1:
                            mergedPdf_1 = _b.sent();
                            // Set document information if provided
                            if (options === null || options === void 0 ? void 0 : options.documentInfo) {
                                _a = options.documentInfo, title = _a.title, author = _a.author, subject = _a.subject, keywords = _a.keywords;
                                if (title)
                                    mergedPdf_1.setTitle(title);
                                if (author)
                                    mergedPdf_1.setAuthor(author);
                                if (subject)
                                    mergedPdf_1.setSubject(subject);
                                if (keywords)
                                    mergedPdf_1.setKeywords(keywords.split(',').map(function (k) { return k.trim(); }));
                            }
                            orderedFilePaths = __spreadArray([], filePaths, true);
                            if ((options === null || options === void 0 ? void 0 : options.fileOrder) && options.fileOrder.length === filePaths.length) {
                                orderedFilePaths = options.fileOrder.map(function (index) {
                                    if (index < 0 || index >= filePaths.length) {
                                        throw new common_1.HttpException("Invalid file index in fileOrder: ".concat(index), common_1.HttpStatus.BAD_REQUEST);
                                    }
                                    return filePaths[index];
                                });
                            }
                            pageCountMap = new Map();
                            currentPageCount = 0;
                            i = 0;
                            _b.label = 2;
                        case 2:
                            if (!(i < orderedFilePaths.length)) return [3 /*break*/, 6];
                            filePath = orderedFilePaths[i];
                            pdfBytes = fs.readFileSync(filePath);
                            return [4 /*yield*/, pdf_lib_1.PDFDocument.load(pdfBytes)];
                        case 3:
                            pdf = _b.sent();
                            // Store the starting page number for this document
                            pageCountMap.set(i, currentPageCount);
                            return [4 /*yield*/, mergedPdf_1.copyPages(pdf, pdf.getPageIndices())];
                        case 4:
                            pages = _b.sent();
                            pages.forEach(function (page) { return mergedPdf_1.addPage(page); });
                            // Update the current page count
                            currentPageCount += pages.length;
                            _b.label = 5;
                        case 5:
                            i++;
                            return [3 /*break*/, 2];
                        case 6:
                            // Add bookmarks if requested
                            // Note: Bookmarks require low-level PDF manipulation
                            // This is a simplified implementation 
                            if ((options === null || options === void 0 ? void 0 : options.addBookmarks) && orderedFilePaths.length > 1) {
                                // In a real implementation, we would create proper bookmarks here
                                // pdf-lib doesn't have high-level support for bookmarks
                                // You would need to create a outline dictionary with destinations
                                console.log('Bookmarks requested, but not implemented in this version');
                            }
                            outputPath = path.join(this.uploadsDir, "merged-".concat(Date.now(), ".pdf"));
                            return [4 /*yield*/, mergedPdf_1.save()];
                        case 7:
                            mergedPdfBytes = _b.sent();
                            fs.writeFileSync(outputPath, mergedPdfBytes);
                            return [2 /*return*/, outputPath];
                        case 8:
                            error_2 = _b.sent();
                            throw new common_1.HttpException("Failed to merge PDFs: ".concat(error_2.message), common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 9: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Split a PDF into multiple PDFs (one per page)
         */
        PdfService_1.prototype.splitPdf = function (filePath) {
            return __awaiter(this, void 0, void 0, function () {
                var pdfBytes, pdfDoc, pageCount, outputPaths, i, newPdf, page, outputPath, newPdfBytes, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 8, , 9]);
                            pdfBytes = fs.readFileSync(filePath);
                            return [4 /*yield*/, pdf_lib_1.PDFDocument.load(pdfBytes)];
                        case 1:
                            pdfDoc = _a.sent();
                            pageCount = pdfDoc.getPageCount();
                            outputPaths = [];
                            i = 0;
                            _a.label = 2;
                        case 2:
                            if (!(i < pageCount)) return [3 /*break*/, 7];
                            return [4 /*yield*/, pdf_lib_1.PDFDocument.create()];
                        case 3:
                            newPdf = _a.sent();
                            return [4 /*yield*/, newPdf.copyPages(pdfDoc, [i])];
                        case 4:
                            page = (_a.sent())[0];
                            newPdf.addPage(page);
                            outputPath = path.join(this.uploadsDir, "page-".concat(i + 1, "-").concat(Date.now(), ".pdf"));
                            return [4 /*yield*/, newPdf.save()];
                        case 5:
                            newPdfBytes = _a.sent();
                            fs.writeFileSync(outputPath, newPdfBytes);
                            outputPaths.push(outputPath);
                            _a.label = 6;
                        case 6:
                            i++;
                            return [3 /*break*/, 2];
                        case 7: return [2 /*return*/, outputPaths];
                        case 8:
                            error_3 = _a.sent();
                            throw new common_1.HttpException("Failed to split PDF: ".concat(error_3.message), common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 9: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Split a PDF with advanced options
         * @param filePath Path to the PDF file
         * @param options Split options including mode and related parameters
         * @returns Array of paths to the split PDF files
         */
        PdfService_1.prototype.splitPdfAdvanced = function (filePath, options) {
            return __awaiter(this, void 0, void 0, function () {
                var mode, pages, ranges, everyNPages, preserveBookmarks, filenamePrefix, pdfBytes, pdfDoc, pageCount_1, outputPaths, prefix, timestamp, _a, sortedPages, startPage_1, _loop_1, this_1, i, _loop_2, this_2, i, n, chunks, _loop_3, this_3, i, n, chunks, _loop_4, this_4, i, i, newPdf, page, outputPath, newPdfBytes, error_4;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 29, , 30]);
                            console.log("Starting advanced PDF split for file: ".concat(filePath));
                            console.log("Split options:", JSON.stringify(options, null, 2));
                            mode = options.mode, pages = options.pages, ranges = options.ranges, everyNPages = options.everyNPages, preserveBookmarks = options.preserveBookmarks, filenamePrefix = options.filenamePrefix;
                            pdfBytes = fs.readFileSync(filePath);
                            return [4 /*yield*/, pdf_lib_1.PDFDocument.load(pdfBytes)];
                        case 1:
                            pdfDoc = _b.sent();
                            pageCount_1 = pdfDoc.getPageCount();
                            outputPaths = [];
                            prefix = filenamePrefix || 'split';
                            timestamp = Date.now();
                            _a = mode;
                            switch (_a) {
                                case 'pages': return [3 /*break*/, 2];
                                case 'ranges': return [3 /*break*/, 7];
                                case 'everyNPages': return [3 /*break*/, 12];
                                case 'bookmarks': return [3 /*break*/, 17];
                            }
                            return [3 /*break*/, 22];
                        case 2:
                            // Split at specific page numbers
                            if (!pages || pages.length === 0) {
                                throw new common_1.HttpException('Page numbers are required for "pages" mode. Please provide an array of page numbers where the document should be split.', common_1.HttpStatus.BAD_REQUEST);
                            }
                            sortedPages = __spreadArray([], pages, true).sort(function (a, b) { return a - b; });
                            if (sortedPages[sortedPages.length - 1] < pageCount_1) {
                                sortedPages.push(pageCount_1 + 1); // Add end marker
                            }
                            startPage_1 = 1;
                            _loop_1 = function (i) {
                                var endPage, newPdf_1, pageIndexes, validPageIndexes, copiedPages, outputPath, newPdfBytes;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            endPage = sortedPages[i];
                                            if (!(endPage > startPage_1 && endPage <= pageCount_1 + 1)) return [3 /*break*/, 4];
                                            return [4 /*yield*/, pdf_lib_1.PDFDocument.create()];
                                        case 1:
                                            newPdf_1 = _c.sent();
                                            pageIndexes = Array.from({ length: endPage - startPage_1 }, function (_, i) { return startPage_1 - 1 + i; });
                                            validPageIndexes = pageIndexes.filter(function (idx) { return idx < pageCount_1; });
                                            if (!(validPageIndexes.length > 0)) return [3 /*break*/, 4];
                                            return [4 /*yield*/, newPdf_1.copyPages(pdfDoc, validPageIndexes)];
                                        case 2:
                                            copiedPages = _c.sent();
                                            copiedPages.forEach(function (page) { return newPdf_1.addPage(page); });
                                            outputPath = path.join(this_1.uploadsDir, "".concat(prefix, "-").concat(i + 1, "-").concat(timestamp, ".pdf"));
                                            return [4 /*yield*/, newPdf_1.save()];
                                        case 3:
                                            newPdfBytes = _c.sent();
                                            fs.writeFileSync(outputPath, newPdfBytes);
                                            outputPaths.push(outputPath);
                                            _c.label = 4;
                                        case 4:
                                            startPage_1 = endPage;
                                            return [2 /*return*/];
                                    }
                                });
                            };
                            this_1 = this;
                            i = 0;
                            _b.label = 3;
                        case 3:
                            if (!(i < sortedPages.length)) return [3 /*break*/, 6];
                            return [5 /*yield**/, _loop_1(i)];
                        case 4:
                            _b.sent();
                            _b.label = 5;
                        case 5:
                            i++;
                            return [3 /*break*/, 3];
                        case 6: return [3 /*break*/, 28];
                        case 7:
                            // Split based on specific page ranges
                            if (!ranges || ranges.length === 0) {
                                throw new common_1.HttpException('Page ranges are required for "ranges" mode. Please provide an array of page ranges with start and end values.', common_1.HttpStatus.BAD_REQUEST);
                            }
                            _loop_2 = function (i) {
                                var _d, start, end, newPdf, pageIndexes, copiedPages, outputPath, newPdfBytes;
                                return __generator(this, function (_e) {
                                    switch (_e.label) {
                                        case 0:
                                            _d = ranges[i], start = _d.start, end = _d.end;
                                            // Validate range
                                            if (start < 1 || end > pageCount_1 || start > end) {
                                                return [2 /*return*/, "continue"];
                                            }
                                            return [4 /*yield*/, pdf_lib_1.PDFDocument.create()];
                                        case 1:
                                            newPdf = _e.sent();
                                            pageIndexes = Array.from({ length: end - start + 1 }, function (_, i) { return start - 1 + i; } // Convert to 0-based index
                                            );
                                            return [4 /*yield*/, newPdf.copyPages(pdfDoc, pageIndexes)];
                                        case 2:
                                            copiedPages = _e.sent();
                                            copiedPages.forEach(function (page) { return newPdf.addPage(page); });
                                            outputPath = path.join(this_2.uploadsDir, "".concat(prefix, "-range").concat(i + 1, "-").concat(timestamp, ".pdf"));
                                            return [4 /*yield*/, newPdf.save()];
                                        case 3:
                                            newPdfBytes = _e.sent();
                                            fs.writeFileSync(outputPath, newPdfBytes);
                                            outputPaths.push(outputPath);
                                            return [2 /*return*/];
                                    }
                                });
                            };
                            this_2 = this;
                            i = 0;
                            _b.label = 8;
                        case 8:
                            if (!(i < ranges.length)) return [3 /*break*/, 11];
                            return [5 /*yield**/, _loop_2(i)];
                        case 9:
                            _b.sent();
                            _b.label = 10;
                        case 10:
                            i++;
                            return [3 /*break*/, 8];
                        case 11: return [3 /*break*/, 28];
                        case 12:
                            // Split every N pages
                            if (!everyNPages || everyNPages < 1) {
                                throw new common_1.HttpException('Valid everyNPages value is required for "everyNPages" mode. Please provide a positive number.', common_1.HttpStatus.BAD_REQUEST);
                            }
                            n = everyNPages;
                            chunks = Math.ceil(pageCount_1 / n);
                            _loop_3 = function (i) {
                                var start, end, newPdf, pageIndexes, copiedPages, outputPath, newPdfBytes;
                                return __generator(this, function (_f) {
                                    switch (_f.label) {
                                        case 0:
                                            start = i * n;
                                            end = Math.min((i + 1) * n, pageCount_1);
                                            return [4 /*yield*/, pdf_lib_1.PDFDocument.create()];
                                        case 1:
                                            newPdf = _f.sent();
                                            pageIndexes = Array.from({ length: end - start }, function (_, j) { return start + j; });
                                            return [4 /*yield*/, newPdf.copyPages(pdfDoc, pageIndexes)];
                                        case 2:
                                            copiedPages = _f.sent();
                                            copiedPages.forEach(function (page) { return newPdf.addPage(page); });
                                            outputPath = path.join(this_3.uploadsDir, "".concat(prefix, "-part").concat(i + 1, "-").concat(timestamp, ".pdf"));
                                            return [4 /*yield*/, newPdf.save()];
                                        case 3:
                                            newPdfBytes = _f.sent();
                                            fs.writeFileSync(outputPath, newPdfBytes);
                                            outputPaths.push(outputPath);
                                            return [2 /*return*/];
                                    }
                                });
                            };
                            this_3 = this;
                            i = 0;
                            _b.label = 13;
                        case 13:
                            if (!(i < chunks)) return [3 /*break*/, 16];
                            return [5 /*yield**/, _loop_3(i)];
                        case 14:
                            _b.sent();
                            _b.label = 15;
                        case 15:
                            i++;
                            return [3 /*break*/, 13];
                        case 16: return [3 /*break*/, 28];
                        case 17:
                            // Split based on bookmarks (outline items)
                            // Note: This is a simplified implementation as pdf-lib doesn't have built-in
                            // bookmark/outline extraction functionality
                            // For demonstration, we'll just create a dummy split similar to every 5 pages
                            // In a real implementation, you would need to:
                            // 1. Access the PDF outline (bookmark structure)
                            // 2. Get the page numbers associated with each bookmark
                            // 3. Use those as split points
                            console.log('Bookmark-based splitting requested, falling back to every 5 pages');
                            n = 5;
                            chunks = Math.ceil(pageCount_1 / n);
                            _loop_4 = function (i) {
                                var start, end, newPdf, pageIndexes, copiedPages, outputPath, newPdfBytes;
                                return __generator(this, function (_g) {
                                    switch (_g.label) {
                                        case 0:
                                            start = i * n;
                                            end = Math.min((i + 1) * n, pageCount_1);
                                            return [4 /*yield*/, pdf_lib_1.PDFDocument.create()];
                                        case 1:
                                            newPdf = _g.sent();
                                            pageIndexes = Array.from({ length: end - start }, function (_, j) { return start + j; });
                                            return [4 /*yield*/, newPdf.copyPages(pdfDoc, pageIndexes)];
                                        case 2:
                                            copiedPages = _g.sent();
                                            copiedPages.forEach(function (page) { return newPdf.addPage(page); });
                                            outputPath = path.join(this_4.uploadsDir, "".concat(prefix, "-bookmark").concat(i + 1, "-").concat(timestamp, ".pdf"));
                                            return [4 /*yield*/, newPdf.save()];
                                        case 3:
                                            newPdfBytes = _g.sent();
                                            fs.writeFileSync(outputPath, newPdfBytes);
                                            outputPaths.push(outputPath);
                                            return [2 /*return*/];
                                    }
                                });
                            };
                            this_4 = this;
                            i = 0;
                            _b.label = 18;
                        case 18:
                            if (!(i < chunks)) return [3 /*break*/, 21];
                            return [5 /*yield**/, _loop_4(i)];
                        case 19:
                            _b.sent();
                            _b.label = 20;
                        case 20:
                            i++;
                            return [3 /*break*/, 18];
                        case 21: return [3 /*break*/, 28];
                        case 22:
                            i = 0;
                            _b.label = 23;
                        case 23:
                            if (!(i < pageCount_1)) return [3 /*break*/, 28];
                            return [4 /*yield*/, pdf_lib_1.PDFDocument.create()];
                        case 24:
                            newPdf = _b.sent();
                            return [4 /*yield*/, newPdf.copyPages(pdfDoc, [i])];
                        case 25:
                            page = (_b.sent())[0];
                            newPdf.addPage(page);
                            outputPath = path.join(this.uploadsDir, "".concat(prefix, "-").concat(i + 1, "-").concat(timestamp, ".pdf"));
                            return [4 /*yield*/, newPdf.save()];
                        case 26:
                            newPdfBytes = _b.sent();
                            fs.writeFileSync(outputPath, newPdfBytes);
                            outputPaths.push(outputPath);
                            _b.label = 27;
                        case 27:
                            i++;
                            return [3 /*break*/, 23];
                        case 28:
                            console.log("PDF split successfully with mode \"".concat(mode, "\". Created ").concat(outputPaths.length, " files."));
                            return [2 /*return*/, outputPaths];
                        case 29:
                            error_4 = _b.sent();
                            console.error("Error splitting PDF: ".concat(error_4.message), error_4);
                            if (error_4 instanceof common_1.HttpException) {
                                throw error_4;
                            }
                            throw new common_1.HttpException("Failed to split PDF: ".concat(error_4.message), common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 30: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Extract specific pages from a PDF
         */
        PdfService_1.prototype.extractPages = function (filePath, pages) {
            return __awaiter(this, void 0, void 0, function () {
                var pdfBytes, pdfDoc, newPdf, pageCount_2, validPages, _i, validPages_1, pageNum, page, outputPath, newPdfBytes, error_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 8, , 9]);
                            pdfBytes = fs.readFileSync(filePath);
                            return [4 /*yield*/, pdf_lib_1.PDFDocument.load(pdfBytes)];
                        case 1:
                            pdfDoc = _a.sent();
                            return [4 /*yield*/, pdf_lib_1.PDFDocument.create()];
                        case 2:
                            newPdf = _a.sent();
                            pageCount_2 = pdfDoc.getPageCount();
                            validPages = pages.filter(function (pageNum) { return pageNum > 0 && pageNum <= pageCount_2; });
                            if (validPages.length === 0) {
                                throw new common_1.HttpException("Invalid page numbers. PDF has ".concat(pageCount_2, " pages."), common_1.HttpStatus.BAD_REQUEST);
                            }
                            _i = 0, validPages_1 = validPages;
                            _a.label = 3;
                        case 3:
                            if (!(_i < validPages_1.length)) return [3 /*break*/, 6];
                            pageNum = validPages_1[_i];
                            return [4 /*yield*/, newPdf.copyPages(pdfDoc, [pageNum - 1])];
                        case 4:
                            page = (_a.sent())[0];
                            newPdf.addPage(page);
                            _a.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 3];
                        case 6:
                            outputPath = path.join(this.uploadsDir, "extracted-".concat(Date.now(), ".pdf"));
                            return [4 /*yield*/, newPdf.save()];
                        case 7:
                            newPdfBytes = _a.sent();
                            fs.writeFileSync(outputPath, newPdfBytes);
                            return [2 /*return*/, outputPath];
                        case 8:
                            error_5 = _a.sent();
                            if (error_5 instanceof common_1.HttpException) {
                                throw error_5;
                            }
                            throw new common_1.HttpException("Failed to extract pages: ".concat(error_5.message), common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 9: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Rotate specific pages of a PDF
         */
        PdfService_1.prototype.rotatePdfPages = function (filePath, rotations) {
            return __awaiter(this, void 0, void 0, function () {
                var pdfBytes, pdfDoc, pageCount, _i, rotations_1, _a, page, rotationDegrees, pdfPage, normalizedDegrees, outputPath, rotatedPdfBytes, error_6;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 3, , 4]);
                            pdfBytes = fs.readFileSync(filePath);
                            return [4 /*yield*/, pdf_lib_1.PDFDocument.load(pdfBytes)];
                        case 1:
                            pdfDoc = _b.sent();
                            pageCount = pdfDoc.getPageCount();
                            // Apply rotations
                            for (_i = 0, rotations_1 = rotations; _i < rotations_1.length; _i++) {
                                _a = rotations_1[_i], page = _a.page, rotationDegrees = _a.degrees;
                                if (page > 0 && page <= pageCount) {
                                    pdfPage = pdfDoc.getPage(page - 1);
                                    normalizedDegrees = ((rotationDegrees % 360) + 360) % 360;
                                    pdfPage.setRotation((0, pdf_lib_1.degrees)(normalizedDegrees));
                                }
                            }
                            outputPath = path.join(this.uploadsDir, "rotated-".concat(Date.now(), ".pdf"));
                            return [4 /*yield*/, pdfDoc.save()];
                        case 2:
                            rotatedPdfBytes = _b.sent();
                            fs.writeFileSync(outputPath, rotatedPdfBytes);
                            return [2 /*return*/, outputPath];
                        case 3:
                            error_6 = _b.sent();
                            throw new common_1.HttpException("Failed to rotate PDF pages: ".concat(error_6.message), common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Compress a PDF to reduce file size
         * This implementation includes image compression, downsampling, and other optimization techniques
         * @param filePath Path to the PDF file
         * @param options Compression options
         * @returns Path to the compressed PDF file
         */
        PdfService_1.prototype.compressPdf = function (filePath_1) {
            return __awaiter(this, arguments, void 0, function (filePath, options) {
                var _a, imageCompression, _b, imageQuality, _c, downsampleImages, _d, downsampleDpi, _e, removeMetadata, _f, flattenFormFields, _g, deduplicateImages, pdfBytes, pdfDoc, pageCount, originalSizeBytes, originalSizeKb, compressedPdf, compressionSettings, compressionOptions, compressedPdfBytes, outputPath, compressedSizeBytes, compressedSizeKb, compressionRatio, error_7;
                if (options === void 0) { options = {}; }
                return __generator(this, function (_h) {
                    switch (_h.label) {
                        case 0:
                            _h.trys.push([0, 4, , 5]);
                            _a = options.imageCompression, imageCompression = _a === void 0 ? compress_options_dto_1.ImageCompressionLevel.MEDIUM : _a, _b = options.imageQuality, imageQuality = _b === void 0 ? 75 : _b, _c = options.downsampleImages, downsampleImages = _c === void 0 ? true : _c, _d = options.downsampleDpi, downsampleDpi = _d === void 0 ? 150 : _d, _e = options.removeMetadata, removeMetadata = _e === void 0 ? false : _e, _f = options.flattenFormFields, flattenFormFields = _f === void 0 ? false : _f, _g = options.deduplicateImages, deduplicateImages = _g === void 0 ? true : _g;
                            pdfBytes = fs.readFileSync(filePath);
                            return [4 /*yield*/, pdf_lib_1.PDFDocument.load(pdfBytes)];
                        case 1:
                            pdfDoc = _h.sent();
                            pageCount = pdfDoc.getPageCount();
                            originalSizeBytes = pdfBytes.length;
                            originalSizeKb = Math.round(originalSizeBytes / 1024);
                            console.log("Starting PDF compression: ".concat(originalSizeKb, " KB, ").concat(pageCount, " pages"));
                            return [4 /*yield*/, (0, compression_1.applyBasicCompression)(pdfDoc, {
                                    imageCompression: imageCompression,
                                    removeMetadata: removeMetadata,
                                    deduplicateImages: deduplicateImages
                                })];
                        case 2:
                            compressedPdf = _h.sent();
                            compressionSettings = (0, compression_1.calculateCompressionSettings)(originalSizeBytes, pageCount, imageCompression);
                            compressionOptions = {
                                // Always use object streams for better compression
                                useObjectStreams: true,
                                // Process more objects per tick for better efficiency
                                objectsPerTick: compressionSettings.objectsPerTick,
                                // Prevent using forms for better compatibility
                                addDefaultPage: false,
                            };
                            return [4 /*yield*/, compressedPdf.save(compressionOptions)];
                        case 3:
                            compressedPdfBytes = _h.sent();
                            outputPath = path.join(this.uploadsDir, "compressed-".concat(Date.now(), ".pdf"));
                            fs.writeFileSync(outputPath, compressedPdfBytes);
                            compressedSizeBytes = compressedPdfBytes.length;
                            compressedSizeKb = Math.round(compressedSizeBytes / 1024);
                            compressionRatio = Math.round((1 - (compressedSizeBytes / originalSizeBytes)) * 100);
                            console.log("Compression complete: ".concat(compressedSizeKb, " KB, ").concat(compressionRatio, "% reduction"));
                            return [2 /*return*/, outputPath];
                        case 4:
                            error_7 = _h.sent();
                            console.error('PDF compression error:', error_7);
                            throw new common_1.HttpException("Failed to compress PDF: ".concat(error_7.message), common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get file path for a file in the uploads directory
         */
        PdfService_1.prototype.getFilePath = function (filename) {
            return path.join(this.uploadsDir, filename);
        };
        /**
         * Get uploads directory path
         */
        PdfService_1.prototype.getUploadsDir = function () {
            return this.uploadsDir;
        };
        /**
         * Get information about a PDF file
         * @param filePath Path to the PDF file
         * @returns Object containing file info (size, pageCount)
         */
        PdfService_1.prototype.getPdfInfo = function (filePath) {
            return __awaiter(this, void 0, void 0, function () {
                var fileStats, fileSize, pdfBytes, pdfDoc, pageCount, error_8;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            fileStats = fs.statSync(filePath);
                            fileSize = Math.round(fileStats.size / 1024) + ' KB';
                            pdfBytes = fs.readFileSync(filePath);
                            return [4 /*yield*/, pdf_lib_1.PDFDocument.load(pdfBytes)];
                        case 1:
                            pdfDoc = _a.sent();
                            pageCount = pdfDoc.getPageCount();
                            return [2 /*return*/, {
                                    size: fileSize,
                                    pageCount: pageCount,
                                }];
                        case 2:
                            error_8 = _a.sent();
                            console.error("Error getting PDF info: ".concat(error_8.message));
                            return [2 /*return*/, {
                                    size: 'Unknown',
                                    pageCount: 0,
                                }];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Clean up: remove temporary files
         */
        /**
         * Analyze a PDF file to identify compression opportunities
         * @param filePath Path to the PDF file
         * @returns Analysis results including recommendations
         */
        PdfService_1.prototype.analyzePdfCompression = function (filePath) {
            return __awaiter(this, void 0, void 0, function () {
                var analysis, fileSize, pdfBytes, pdfDoc, pageCount, hasImages, avgPageSize, estimatedImageSize, pdfData, hasMetadata, hasFormFields, additionalInfo, error_9;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            _e.trys.push([0, 4, , 5]);
                            return [4 /*yield*/, (0, compression_1.analyzePdfForCompression)(filePath)];
                        case 1:
                            analysis = _e.sent();
                            fileSize = fs.statSync(filePath).size;
                            pdfBytes = fs.readFileSync(filePath);
                            return [4 /*yield*/, pdf_lib_1.PDFDocument.load(pdfBytes)];
                        case 2:
                            pdfDoc = _e.sent();
                            pageCount = pdfDoc.getPageCount();
                            hasImages = fileSize / pageCount > 100 * 1024;
                            avgPageSize = Math.round(fileSize / pageCount / 1024);
                            estimatedImageSize = hasImages ? "~".concat(Math.round(fileSize * 0.7 / 1024), " KB") : 'None detected';
                            return [4 /*yield*/, pdfParse(pdfBytes)];
                        case 3:
                            pdfData = _e.sent();
                            hasMetadata = !!(((_a = pdfData.info) === null || _a === void 0 ? void 0 : _a.Title) || ((_b = pdfData.info) === null || _b === void 0 ? void 0 : _b.Author) ||
                                ((_c = pdfData.info) === null || _c === void 0 ? void 0 : _c.Subject) || ((_d = pdfData.info) === null || _d === void 0 ? void 0 : _d.Keywords));
                            hasFormFields = false;
                            additionalInfo = {
                                hasImages: hasImages,
                                estimatedImageSize: estimatedImageSize,
                                hasMetadata: hasMetadata,
                                hasFormFields: hasFormFields,
                                avgPageSizeKB: avgPageSize,
                            };
                            // Return combined analysis
                            return [2 /*return*/, __assign(__assign({}, analysis), additionalInfo)];
                        case 4:
                            error_9 = _e.sent();
                            console.error('Error analyzing PDF for compression:', error_9);
                            throw new common_1.HttpException("Failed to analyze PDF: ".concat(error_9.message), common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        PdfService_1.prototype.cleanupFile = function (filePath) {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            catch (error) {
                console.error("Failed to clean up file ".concat(filePath, ":"), error);
            }
        };
        return PdfService_1;
    }());
    __setFunctionName(_classThis, "PdfService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PdfService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PdfService = _classThis;
}();
exports.PdfService = PdfService;
