import { Controller, Get, Param, Res, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('pdf-compress')
@Controller('pdf/compression-stats')
export class PdfCompressionStatsController {
  private static compressionStats = new Map<string, any>();

  /**
   * Store compression stats for retrieval
   * @param fileId Unique ID for the compressed file
   * @param stats Compression statistics
   */
  static storeStats(fileId: string, stats: any) {
    PdfCompressionStatsController.compressionStats.set(fileId, stats);
    
    // Clean up older stats after 30 minutes
    setTimeout(() => {
      PdfCompressionStatsController.compressionStats.delete(fileId);
    }, 30 * 60 * 1000);
    
    return fileId;
  }

  /**
   * Get compression stats for a file
   */
  @Get(':fileId')
  @ApiOperation({
    summary: 'Get compression statistics for a file',
    description: 'Returns compression statistics for a previously compressed PDF file'
  })
  @ApiParam({
    name: 'fileId',
    description: 'Unique ID for the compressed file',
    required: true
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved compression stats'
  })
  @ApiResponse({
    status: 404,
    description: 'Stats not found for this file ID'
  })
  getCompressionStats(@Param('fileId') fileId: string, @Res() res: Response) {
    const stats = PdfCompressionStatsController.compressionStats.get(fileId);
    
    if (!stats) {
      throw new HttpException('Compression stats not found for this file ID', HttpStatus.NOT_FOUND);
    }
    
    return res.json(stats);
  }
}