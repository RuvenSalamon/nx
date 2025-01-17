import { isCI } from '../ci/is-ci';

export const NxCloudChoices = ['yes', 'github', 'circleci', 'skip'];

const messageOptions = {
  setupCI: [
    {
      code: 'enable-nx-cloud',
      message: `Do you want Nx Cloud to make your CI fast?`,
      initial: 'github',
      choices: [
        { value: 'yes', name: 'Yes, enable Nx Cloud' },
        { value: 'github', name: 'Yes, configure Nx Cloud for GitHub Actions' },
        { value: 'circleci', name: 'Yes, configure Nx Cloud for Circle CI' },
        { value: 'skip', name: 'Skip for now' },
      ],
      footer:
        '\nRead more about remote cache at https://nx.dev/ci/features/remote-cache',
      hint: `\n(it's free and can be disabled any time)`,
      fallback: undefined,
    },
    {
      code: 'set-up-ci',
      message: `Set up CI with caching, distribution and test deflaking`,
      initial: 'github',
      choices: [
        { value: 'github', name: 'Yes, for GitHub Actions with Nx Cloud' },
        { value: 'circleci', name: 'Yes, for CircleCI with Nx Cloud' },
        { value: 'skip', name: 'Skip for now' },
      ],
      footer:
        '\nRead more about CI benefits with Nx at https://nx.dev/ci/intro/ci-with-nx',
      hint: `\n(it's free and can be disabled any time)`,
      fallback: { value: 'skip', key: 'setupNxCloud' },
    },
  ],
  setupNxCloud: [
    {
      code: 'enable-caching',
      message: `Would you like remote caching to make your build faster?`,
      initial: 'yes',
      choices: [
        { value: 'yes', name: 'Yes' },
        { value: 'skip', name: 'Skip for now' },
      ],
      footer:
        '\nRead more about remote caching at https://nx.dev/ci/features/remote-cache',
      hint: `\n(it's free and can be disabled any time)`,
      fallback: undefined,
    },
  ],
} as const;

export type MessageKey = keyof typeof messageOptions;
type MessageData = typeof messageOptions[MessageKey][number];

export class PromptMessages {
  private selectedMessages: { [key in MessageKey]?: number } = {};

  getPrompt(key: MessageKey): MessageData {
    if (this.selectedMessages[key] === undefined) {
      if (process.env.NX_GENERATE_DOCS_PROCESS === 'true') {
        this.selectedMessages[key] = 0;
      } else {
        this.selectedMessages[key] = Math.floor(
          Math.random() * messageOptions[key].length
        );
      }
    }
    return messageOptions[key][this.selectedMessages[key]!];
  }

  codeOfSelectedPromptMessage(key: MessageKey): string {
    const selected = this.selectedMessages[key];
    if (selected === undefined) {
      return '';
    } else {
      return messageOptions[key][selected].code;
    }
  }
}

export const messages = new PromptMessages();

/**
 * We are incrementing a counter to track how often create-nx-workspace is used in CI
 * vs dev environments. No personal information is collected.
 */
export async function recordStat(opts: {
  command: string;
  nxVersion: string;
  useCloud: boolean;
  meta: string[];
}) {
  try {
    const major = Number(opts.nxVersion.split('.')[0]);
    if (process.env.NX_VERBOSE_LOGGING === 'true') {
      console.log(`Record stat. Major: ${major}`);
    }
    if (major < 10 || major > 16) return; // test version, skip it
    const axios = require('axios');
    await (axios['default'] ?? axios)
      .create({
        baseURL: 'https://cloud.nx.app',
        timeout: 400,
      })
      .post('/nx-cloud/stats', {
        command: opts.command,
        isCI: isCI(),
        useCloud: opts.useCloud,
        meta: opts.meta.filter((v) => !!v).join(','),
      });
  } catch (e) {
    if (process.env.NX_VERBOSE_LOGGING === 'true') {
      console.error(e);
    }
  }
}
