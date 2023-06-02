describe('A thing', () => {
  it('should work', () => {
    expect(1).toEqual(1);
  });

  it('should be ok', () => {
    expect(1).toEqual(1);
  });

  describe('a nested thing', () => {
    it('should work', () => {
      expect(1).toEqual(1);
    });
  });
}); 