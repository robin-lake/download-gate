import {useGetUsers} from '../network/getUsers';

export default function Users() {


//   const { data, loading, error } = useGetUsers()
const { data, isLoading, error, refetch } = useGetUsers();

//   if (loading) return <p>Loading...</p>;
//   if (error) return <p>{error.message}</p>;

//   return (
//     <div>
//         <h1>Users</h1>
//         <ul>
//         {/* {data?.map((user) => (
//             <li key={user.id}>{user.name}</li>
//         ))} */}
//         </ul>
//     </div>
//   );
// }

if (isLoading) return <p>Loading...</p>;
if (error) return <p>{error.message}</p>;

return (
  <div>
    <h1>Users</h1>
    <div className="currentUsers">
      <ul>
        {data?.items?.map((user) => (
          <li key={user.user_id}>{user.name}</li>
        ))}
      </ul>
    </div>
  </div>
);
}