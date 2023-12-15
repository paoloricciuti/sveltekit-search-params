import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	webServer: {
		command:
			'pnpm run build && pnpm install --frozen-lockfile && pnpm run build:playground && pnpm run preview:playground',
		port: 4173,
		stderr: 'pipe',
		stdout: 'pipe',
	},
	testDir: 'tests',
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
};

export default config;
