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

  // The page's heading, which the tests have to add themselves.
  function addHeading(id: string): HTMLElement {
    const heading = document.createElement('h2');
    heading.id = id;
    heading.tabIndex = -1;
    heading.scrollIntoView = vi.fn();
    document.body.append(heading);
    return heading;
  }

  afterEach(() => document.querySelectorAll('body > h2').forEach((heading) => heading.remove()));

  it('marks the current section in the list and in the select', async () => {
    const element: HTMLElement = (await show('retur')).nativeElement;

    const links = element.querySelectorAll('a');
    expect(links[0].getAttribute('aria-current')).toBeNull();
    expect(links[1].getAttribute('aria-current')).toBe('true');
    expect(element.querySelector('select')?.value).toBe('retur');
  });

  it('scrolls to the section, moves the focus there and puts its id in the address', async () => {
    const fixture = await show('frakt');
    const heading = addHeading('retur');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.nativeElement.querySelectorAll('a')[1].click();

    expect(heading.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    expect(document.activeElement).toBe(heading);
    expect(navigate).toHaveBeenCalledWith(['/villkor'], { fragment: 'retur', scroll: 'manual' });
  });

  it('scrolls to the section chosen in "Hoppa till avsnitt"', async () => {
    const fixture = await show('frakt');
    const heading = addHeading('retur');
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    select.value = 'retur';
    select.dispatchEvent(new Event('change'));
    // The scroll waits for the select to get the focus back.
    await new Promise((resolve) => setTimeout(resolve));

    expect(heading.scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(heading);
  });
});
