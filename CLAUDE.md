# Code style
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (eg. import { foo } from 'bar')
- Use tsconfig paths for imports, not relative paths
- Add new lines between every import groups (built-in, external, internal)
- No hardcoded value, always put in .env or in an enum or else

# Workflow
- Be sure to typecheck when you're done making a series of code changes
- Prefer running single tests, and not the whole test suite, for performance
- For every entry in .env file, add an example entry in .env.example file
- Always leave heavy tasks to the server, client should only be used for data entry and data display
- If a server-side function can be run in the database (as triggers or functions), do it

# Tools
- Always use pnpm as a package manager