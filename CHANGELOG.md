# sveltekit-search-params

## 3.1.0

### Minor Changes

-   chore: split out the ssp definitions ([#116](https://github.com/paoloricciuti/sveltekit-search-params/pull/116))

## 3.0.0

### Major Changes

-   Return non-null writable for defined defaultValue and fix types for `queryParameters` ([#87](https://github.com/paoloricciuti/sveltekit-search-params/pull/87))

### Patch Changes

-   fix: avoid complex values default being overriden on write ([#89](https://github.com/paoloricciuti/sveltekit-search-params/pull/89))

## 2.1.2

### Patch Changes

-   Fix the override setting to allow for false values ([#74](https://github.com/paoloricciuti/sveltekit-search-params/pull/74))

## 2.1.1

### Patch Changes

-   fix: allow building the app in prerendering by faking the page store during building ([#68](https://github.com/paoloricciuti/sveltekit-search-params/pull/68))

## 2.1.0

### Minor Changes

-   feat: add equalityFn option for complex objects and array ([#64](https://github.com/paoloricciuti/sveltekit-search-params/pull/64))

## 2.0.0

### Major Changes

-   breaking: remove double navigation, debounce navigate after timeout ([#60](https://github.com/paoloricciuti/sveltekit-search-params/pull/60))
    feat: add showDefaults option to chose wether to show the defaults or not in the URL

## 1.1.1

### Patch Changes

-   fde7148: fix: rework how defaults works

## 1.1.0

### Minor Changes

-   7a99cd8: feat: sorting search params before navigating

## 1.0.18

### Patch Changes

-   ac0a8c3: extend peer dep sveltekit to 2.0

## 1.0.17

### Patch Changes

-   cc1ad2a: rework the library to use a derived store to solve some issue

## 1.0.16

### Patch Changes

-   b606180: fix: type ssp array

## 1.0.15

### Patch Changes

-   2e7f889: Allow returning undefined from encode to remove param from URL

## 1.0.14

### Patch Changes

-   a81535c: Fix undefined not removing params (#31)

## 1.0.13

### Patch Changes

-   8924160: feat: support svelte 4

## 1.0.12

### Patch Changes

-   901d9c7: Add client side check before invoking goto

## 1.0.11

### Patch Changes

-   6f78e87: removed changesets as dependency and add it as dev dependency

## 1.0.10

### Patch Changes

-   33276b7: fixing changeset

## 1.0.8

### Patch Changes

-   b0b4b0a: replublish

## 1.0.7

### Patch Changes

-   34a1e1b: the hash of the url now doesn't get's erased when the search params update
