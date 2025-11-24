const ClaudeService = require('../../services/ClaudeService');

describe('ClaudeService', () => {
  let service;

  beforeEach(() => {
    process.env.CLAUDE_API_KEY = 'test-key';
    service = new ClaudeService();
  });

  describe('repairSprite', () => {
    it('should repair a flat array into a 2D array', () => {
      const sprite = {
        pixelMap: ['#000', '#FFF', '#FFF', '#000'],
        width: 2,
        height: 2
      };
      
      const repaired = service.repairSprite(sprite, 2);
      
      expect(repaired.pixelMap).toHaveLength(2);
      expect(repaired.pixelMap[0]).toEqual(['#000', '#FFF']);
      expect(repaired.pixelMap[1]).toEqual(['#FFF', '#000']);
    });

    it('should pad missing rows', () => {
      const sprite = {
        pixelMap: [['#000', '#000']],
        width: 2,
        height: 2
      };
      
      const repaired = service.repairSprite(sprite, 2, '#FFF');
      
      expect(repaired.pixelMap).toHaveLength(2);
      expect(repaired.pixelMap[1]).toEqual(['#FFF', '#FFF']);
    });

    it('should pad missing columns', () => {
      const sprite = {
        pixelMap: [['#000'], ['#000']],
        width: 2,
        height: 2
      };
      
      const repaired = service.repairSprite(sprite, 2, '#FFF');
      
      expect(repaired.pixelMap[0]).toEqual(['#000', '#FFF']);
      expect(repaired.pixelMap[1]).toEqual(['#000', '#FFF']);
    });

    it('should truncate excess rows and columns', () => {
      const sprite = {
        pixelMap: [
          ['#000', '#000', '#000'],
          ['#000', '#000', '#000'],
          ['#000', '#000', '#000']
        ],
        width: 2,
        height: 2
      };
      
      const repaired = service.repairSprite(sprite, 2);
      
      expect(repaired.pixelMap).toHaveLength(2);
      expect(repaired.pixelMap[0]).toHaveLength(2);
    });

    it('should handle empty pixelMap', () => {
      const sprite = {
        pixelMap: [],
        width: 2,
        height: 2
      };
      
      const repaired = service.repairSprite(sprite, 2, '#000');
      
      expect(repaired.pixelMap).toHaveLength(2);
      expect(repaired.pixelMap[0]).toEqual(['#000', '#000']);
    });
  });
});