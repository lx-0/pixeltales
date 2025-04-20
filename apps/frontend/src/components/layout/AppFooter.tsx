import { SiGithub } from '@icons-pack/react-simple-icons';

export function AppFooter() {
  return (
    <footer className="p-2 sm:p-4 bg-gray-800 mt-3 sm:mt-6 border-t border-gray-700">
      <div className="mx-auto w-full">
        <p className="text-center text-gray-400 text-xs sm:text-sm">
          © 2024 PixelTales - An AI Character Interaction Experiment
        </p>
        <p className="text-center text-gray-400 text-xs sm:text-sm mt-1">
          Powered by{' '}
          <a
            href="https://yesterday-ai.de"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Yesterday AI ✨
          </a>
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <a
            href="https://github.com/lx-0/pixeltales"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="GitHub Repository"
          >
            <SiGithub size={18} className="sm:w-5 sm:h-5" />
          </a>
          <span className="text-gray-400 text-xs sm:text-sm">
            Created by
            <a
              href="https://github.com/lx-0"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 hover:text-white transition-colors"
            >
              @lx-0
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
