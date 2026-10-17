import {render, waitFor} from '@testing-library/react';
import {PwaRegistration} from '@/src/components/PwaRegistration';

describe('PwaRegistration', () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');

    afterEach(() => {
        if (original) {
            Object.defineProperty(navigator, 'serviceWorker', original);
        } else {
            Reflect.deleteProperty(navigator, 'serviceWorker');
        }
    });

    it('registers the worker at the origin root', async () => {
        const register = jest.fn().mockResolvedValue({});
        Object.defineProperty(navigator, 'serviceWorker', {
            configurable: true,
            value: {register},
        });

        render(<PwaRegistration/>);
        await waitFor(() => expect(register).toHaveBeenCalledWith('/sw.js'));
    });
});
