import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToursService } from './tours.service.js';

function createService() {
  const repository = {
    count: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue({ affected: 0, raw: [] }),
    find: vi.fn().mockResolvedValue([]),
  };
  return { repository, service: new ToursService(repository as never) };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('ToursService expiry', () => {
  it('deletes journeys older than the current Ethiopian calendar date at startup and every minute', async () => {
    vi.useFakeTimers();
    const { repository, service } = createService();
    const expectedDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Addis_Ababa',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    await service.onModuleInit();
    expect(repository.delete).toHaveBeenCalledTimes(1);
    expect(repository.delete.mock.calls[0][0].date.value).toBe(expectedDate);

    await vi.advanceTimersByTimeAsync(60_000);
    expect(repository.delete).toHaveBeenCalledTimes(2);

    service.onModuleDestroy();
  });

  it('cleans expired journeys before returning the public catalog', async () => {
    const { repository, service } = createService();

    await service.findAll();

    expect(repository.delete.mock.invocationCallOrder[0]).toBeLessThan(repository.find.mock.invocationCallOrder[0]);
  });
});
