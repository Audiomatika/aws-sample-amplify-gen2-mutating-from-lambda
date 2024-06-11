import { useState, useEffect } from 'react'
import { Authenticator } from '@aws-amplify/ui-react';
import { Table, TableCell, TableBody, TableHead, TableRow } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../amplify/data/resource';
import './App.css';

const client = generateClient<Schema>({
  authMode: 'userPool',
});

function App() {

  const [devices, setDevices] = useState<Schema['Device']['type'][]>([]);

  const fetchDevices = async () => {
    const { data: devices, errors } = await client.models.Device.list();
    setDevices(devices);
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // サブスクライブ
  useEffect(() => {
    const sub = client.subscriptions.receiveUpdatedStatus().subscribe({
      next: (updatedDevice) => {
        setDevices((currentDevices) => currentDevices.map((device) => device.id === updatedDevice.id ? updatedDevice : device));
      },
    });
    return () => sub.unsubscribe();
  }, []);

  // とりあえず固定値でデバイスを新規登録 (複数登録する場合は `name` を都度変更してください)
  // (DynamoDB のパーティションキーには固有の `id` が自動で生成されて登録される
  const createDevice = async () => {
    await client.models.Device.create({
      name: "device-A-1",
      isConnect: false,
    });

    // 追加したら一覧を再取得
    fetchDevices();
  };

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <>
          <p>Demo App</p>
          <p>
            <button onClick={createDevice}>New Device</button>
          </p>
          <Table style={{backgroundColor: "white"}}>
            <TableHead>
              <TableRow>
                <TableCell as="th">ID</TableCell>
                <TableCell as="th">Name</TableCell>
                <TableCell as="th">isConnect</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.map((device) => (
                <TableRow>
                  <TableCell>{device.id}</TableCell>
                  <TableCell>{device.name}</TableCell>
                  <TableCell>{device.isConnect.toString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Authenticator>
  )
}

export default App