Refactor the generated React code from TypeScript (.tsx) to standard React JavaScript (.jsx).

The goal is to remove all TypeScript syntax while keeping the same component structure and functionality.

Perform the following changes:

1. Remove all TypeScript types including:

   * interface
   * type
   * React.FC
   * generics
   * type annotations
   * props type definitions

2. Convert components to standard React functional components using JavaScript.

Example conversion:

Before (TSX):

const Timer: React.FC<TimerProps> = ({ duration }: TimerProps) => {
const [time, setTime] = useState<number>(duration);
}

After (JSX):

function Timer({ duration }) {
const [time, setTime] = useState(duration);
}

3. Replace all typed hooks:

useState<number>(0)

with:

useState(0)

4. Remove all import statements referencing TypeScript types.

5. Keep all JSX structure, Tailwind classes, and UI components unchanged.

6. Rename all files from:

*.tsx → *.jsx

7. Ensure the code runs in a standard React + Vite or React + CRA environment without TypeScript.

Do NOT redesign UI or change layout logic.

The goal is purely converting TypeScript React code into plain JavaScript React code.
