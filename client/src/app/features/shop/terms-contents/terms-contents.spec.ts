import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TermsContents } from './terms-contents';

describe('TermsContents', () => {
  const sections = [
    { id: 'frakt', title: 'Frakt', content: [] },
    { id: 'retur', title: 'Retur', content: [] },
  ];

  async function show(current: string): Promise<ComponentFixture<TermsContents>> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TermsContents);
    fixture.componentRef.setInput('sections', sections);
    fixture.componentRef.setInput('current', current);
    await fixture.whenStable();
    return fixture;
  }

  it('marks the current section', async () => {
    const links = (await show('retur')).nativeElement.querySelectorAll('a');

    expect(links[0].getAttribute('aria-current')).toBeNull();
    expect(links[1].getAttribute('aria-current')).toBe('true');
  });

  it('scrolls to the section, moves the focus there and puts its id in the address', async () => {
    const fixture = await show('frakt');
    // The page's heading, which the test has to add itself.
    const heading = document.createElement('h2');
    heading.id = 'retur';
    heading.tabIndex = -1;
    heading.scrollIntoView = vi.fn();
    document.body.append(heading);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.nativeElement.querySelectorAll('a')[1].click();

    expect(heading.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    expect(document.activeElement).toBe(heading);
    expect(navigate).toHaveBeenCalledWith(['/villkor'], { fragment: 'retur', scroll: 'manual' });
    heading.remove();
  });
});
