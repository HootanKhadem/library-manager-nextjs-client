import {AUTHORS, BORGES_WORKS} from '@/src/lib/data';
import AuthorsPage from '@/src/components/pages/AuthorsPage';

export default function AuthorsRoute() {
    return <AuthorsPage authors={AUTHORS} borgesWorks={BORGES_WORKS}/>;
}
