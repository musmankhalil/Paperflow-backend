import { Test, TestingModule } from '@nestjs/testing';
import { PdfConvertController } from '../controllers/pdf-convert.controller';
import { PdfService } from '../pdf.service';
import { HttpStatus } from '@nestjs/common';
import { ConvertToWordDto, ConversionQuality } from '../dto/convert-to-word.dto';

describe('PdfConvertController', () => {
  let controller: PdfConvertController;
  let service: PdfService;

  // Mock response object
  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.download = jest.fn().mockReturnValue(res);
    return res;
  };
  
  // Mock file object
  const mockFile = {
    path: '/path/to/test.pdf',
    mimetype: 'application/pdf',
    originalname: 'test.pdf',
    size: 1024,
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfConvertController],
      providers: [
        {
          provide: PdfService,
          useValue: {
            convertPdfToWordBasic: jest.fn().mockResolvedValue('/path/to/converted-basic.docx'),
            convertPdfToWordAdvanced: jest.fn().mockResolvedValue('/path/to/converted-advanced.docx'),
            getPdfInfo: jest.fn().mockResolvedValue({ size: '1024 KB', pageCount: 10 }),
            getFilePath: jest.fn().mockReturnValue('/path/to/file.docx'),
          },
        },
      ],
    }).compile();

    controller = module.get<PdfConvertController>(PdfConvertController);
    service = module.get<PdfService>(PdfService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('convertPdfToWordBasic', () => {
    it('should convert PDF to Word with basic settings', async () => {
      const res = mockResponse();
      
      await controller.convertPdfToWordBasic(mockFile, res);
      
      expect(service.convertPdfToWordBasic).toHaveBeenCalledWith(mockFile.path);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalled();
    });
    
    it('should handle error when no file is provided', async () => {
      const res = mockResponse();
      
      await controller.convertPdfToWordBasic(null, res);
      
      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalled();
    });
    
    it('should handle error when file is not a PDF', async () => {
      const res = mockResponse();
      const invalidFile = { ...mockFile, mimetype: 'image/jpeg' };
      
      await controller.convertPdfToWordBasic(invalidFile as Express.Multer.File, res);
      
      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalled();
    });
  });
  
  describe('convertPdfToWordAdvanced', () => {
    it('should convert PDF to Word with advanced settings', async () => {
      const res = mockResponse();
      const options: ConvertToWordDto = {
        quality: ConversionQuality.ENHANCED,
        formatting: {
          preserveImages: true,
          preserveTables: true,
        },
      };
      
      await controller.convertPdfToWordAdvanced(mockFile, options, res);
      
      expect(service.convertPdfToWordAdvanced).toHaveBeenCalledWith(mockFile.path, options);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalled();
    });
    
    it('should handle error when no file is provided', async () => {
      const res = mockResponse();
      const options: ConvertToWordDto = {};
      
      await controller.convertPdfToWordAdvanced(null, options, res);
      
      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalled();
    });
  });
  
  describe('downloadConvertedFile', () => {
    it('should download a converted file', async () => {
      const res = mockResponse();
      const filename = 'converted-1234567890.docx';
      
      jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
      
      await controller.downloadConvertedFile(res, filename);
      
      expect(service.getFilePath).toHaveBeenCalledWith(filename);
      expect(res.download).toHaveBeenCalled();
    });
    
    it('should handle error when file does not exist', async () => {
      const res = mockResponse();
      const filename = 'nonexistent.docx';
      
      jest.spyOn(require('fs'), 'existsSync').mockReturnValue(false);
      
      await controller.downloadConvertedFile(res, filename);
      
      expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(res.json).toHaveBeenCalled();
    });
  });
});
