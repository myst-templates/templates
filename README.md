# MyST Templates

A community curated collection of [MyST Markdown](https://myst.tools) compatible templates.
These templates allow `myst` to export markdown files as typeset, formatted documents using PDF, LaTeX or Word.
Templates can expose data-driven options for customization ensuring the final documents comply with author submission guidelines provided by a particular journal, conference organizer or university.

This repository:

- holds issues for new and general information for improving existing templates
- downloads each template listed in the [data](./data) folder
- deploys an API to https://api.myst.tools
- automatically updates the organization readme

## Contributing a Template

To add a new LaTeX template checkout [tex.yml](./data/tex.yml), the template should be added as:

```yaml
templates:
  - organization: myst
    name: agu2019
    source: https://github.com/myst-templates/agu2019
    latest: main
```

Install the mini CLI tool using `npm install` and `npm run dev` (puts this in watch mode, so you can kill after the output is complete).
Then call `myst-templates index data/tex.yml` from the main folder, which will create an index file and update the organization readme.
