export const getSafeUUID = (): string => {
  // 1. 브라우저/Node 환경에서 표준 API가 존재하는지 확인
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // 2. 구형 브라우저나 비보안(HTTP) 환경을 위한 대체 로직 (RFC4122 준수)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return (([1e7] as any) + -1e3 + -4e3 + -8e3 + -1e11).replace(
      /[018]/g,
      (c: any) =>
        (
          c ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16),
    );
  }

  // 3. 최후의 수단 (보안성은 낮으나 오류는 방지함)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
