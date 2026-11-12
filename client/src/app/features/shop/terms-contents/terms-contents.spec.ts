import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TermsContents } from './terms-contents';

describe('TermsContents', () => {
  const sections = [
    { id: 'frakt', title: 'Frakt', content: [] },
    { id: 'retur', title: 'Retur', content: [] },
  ];

  it('marks the current section', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TermsContents);
    fixture.componentRef.setInput('sections', sections);
    fixture.componentRef.setInput('current', 'retur');
    await fixture.whenStable();

    const links = fixture.nativeElement.querySelectorAll('a');
    expect(links[0].getAttribute('aria-current')).toBeNull();
    expect(links[1].getAttribute('aria-current')).toBe('true');
  });
});
