# Screenshot slots for the Data Collection guide

The `/data-collection` page in the app renders `ImageSlot` components that look
for files in this folder. When a file is missing the UI falls back to a dashed
placeholder box with instructions.

To replace a placeholder with a real screenshot, save a PNG to the matching
path. For example:

```
public/guides/vmware/03-summary.png
public/guides/hyperv/01-manager.png
public/guides/nutanix/03-host-details.png
```

Expected files (feel free to add more and update `DataCollection.tsx`):

- `vmware/01-login.png`
- `vmware/03-summary.png`
- `vmware/04-processors.png`
- `hyperv/01-manager.png`
- `hyperv/03-wac.png`
- `hyperv/04-scvmm.png`
- `nutanix/01-prism.png`
- `nutanix/02-hardware.png`
- `nutanix/03-host-details.png`

**Notes**
- Images are served from the Vite `public/` folder, so the path shown in
  `ImageSlot` is relative to `public/` — the component prefixes it with the
  correct GitHub Pages base path at runtime.
- Keep screenshots ≤ 1600 px wide to avoid bloating the bundle.
- Remove or redact any customer-identifiable data before committing.
