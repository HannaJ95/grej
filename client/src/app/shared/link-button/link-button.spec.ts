import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LinkButton } from './link-button';

@Component({
  imports: [LinkButton],
  template: `
    <button appLinkButton type="button">Redigera</button>
    <button appLinkButton tone="danger" type="button">Ta bort</button>
  `,
})
class TestPage {}

describe('LinkButton', () => {
  it('has the link text style, and the danger tone its own class', async () => {
    const fixture = TestBed.createComponent(TestPage);
    await fixture.whenStable();
    const [edit, remove] = fixture.nativeElement.querySelectorAll('button');

    expect(edit.textContent).toBe('Redigera');
    expect([...edit.classList]).toEqual(['text-link-s']);
    expect([...remove.classList]).toEqual(['text-link-s', 'danger']);
  });
});
