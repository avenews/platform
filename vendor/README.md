# Pinned Avenews design-system package

`avenews-design-system-1.9.0.tgz` is the unmodified npm package artifact produced by running `npm pack` in the private organization repository:

```text
avenews/Avenews-Ionic-Design-System
```

Package metadata:

```text
name:    @avenews/design-system
version: 1.9.0
source commit: 4dd1b7b28e9e9a7744c73eb9bb7c8dd1a560900e
SHA-256: 9a21d1723f65a506a25c65f02b02d7a6e7b9e2ce31167b4c0476f2cbc148ef59
```

The tarball contains the packaged design-system library, including its prebuilt Angular entry point and shared styles. Component source was not copied into the portal application and the artifact must not be edited in place.

## Updating

1. Prepare and validate a new version in `avenews/Avenews-Ionic-Design-System`.
2. Produce its npm artifact through the design-system repository's release process.
3. Replace the tarball here.
4. Update the version and file reference in `package.json`.
5. Record the new source commit and SHA-256 digest in this file.
6. Run `npm run check` and review the Netlify Deploy Preview.

When GitHub Packages access is standardized for product repositories and Netlify, replace the file dependency with the same pinned registry version. Application imports remain unchanged.
