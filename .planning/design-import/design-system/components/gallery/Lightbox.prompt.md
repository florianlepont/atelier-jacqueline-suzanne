Full-viewport image viewer for browsing a gallery's photos one at a time.

```jsx
<Lightbox imageSrc="/img/rebut-03.jpg" index={3} total={12} onClose={close} onPrev={prev} onNext={next} />
```

Wire `Escape` to `onClose` and arrow keys to `onPrev`/`onNext` at the call site; trap focus while open and return it to the triggering thumbnail on close.
