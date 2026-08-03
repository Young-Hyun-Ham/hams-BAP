import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  addDoc,
  updateDoc,
  runTransaction,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

export const fetchScenarios = async () => {
  // console.log("Fetching scenarios from Firestore...");
  const scenariosCollection = collection(db, 'scenarios');
  const querySnapshot = await getDocs(scenariosCollection);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || doc.id,
      description: data.description || '',
      updatedAt: data.updatedAt || null,
      lastUsedAt: data.lastUsedAt || null,
      ...data,
    };
  });
};

export const createScenario = async ({ newScenarioName, job, description }: any) => {
  const scenarioId = uuidv4();
  const newScenarioRef = doc(db, 'scenarios', scenarioId);
  const docSnap = await getDoc(newScenarioRef);
  if (docSnap.exists()) {
    throw new Error('A scenario with that name already exists.');
  }
  const newScenarioData = { 
    name: newScenarioName, 
    job, 
    description, 
    nodes: [], 
    edges: [], 
    startNodeId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastUsedAt: null
  };
  await setDoc(newScenarioRef, newScenarioData);
  return { id: newScenarioName, ...newScenarioData, createdAt: new Date(), updatedAt: new Date(), lastUsedAt: null };
};

export const renameScenario = async ({ oldScenario, newName, job, description }: any) => {
    const oldDocRef = doc(db, 'scenarios', oldScenario.id);

    if (oldScenario.name !== newName) {
      const newDocRef = doc(db, 'scenarios', newName);
      const newDocSnap = await getDoc(newDocRef);
      if (newDocSnap.exists()) {
        throw new Error('A scenario with that name already exists.');
      }

      const oldDocSnap = await getDoc(oldDocRef);
      if (oldDocSnap.exists()) {
        const batch = writeBatch(db);
        const newData = { ...oldDocSnap.data(), name: newName, job, description, updatedAt: serverTimestamp() };
        batch.set(newDocRef, newData);
        batch.delete(oldDocRef);
        await batch.commit();
      } else {
        throw new Error('Original scenario not found.');
      }
    } else {
      await updateDoc(oldDocRef, { job, description, updatedAt: serverTimestamp() });
    }
};

export const patchScenario = async ({
  id,
  name,
  job,
  description,
}: any) => {
  if (!id) {
    throw new Error('Scenario ID is required.');
  }

  const scenarioRef = doc(db, 'scenarios', id);
  const scenarioSnapshot = await getDoc(scenarioRef);

  if (!scenarioSnapshot.exists()) {
    throw new Error('Scenario not found.');
  }

  const updateData = {
    ...(name !== undefined && { name }),
    ...(job !== undefined && { job }),
    ...(description !== undefined && { description }),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(scenarioRef, updateData);

  return {
    id,
    ...scenarioSnapshot.data(),
    ...updateData,
    updatedAt: new Date(),
  };
};

export const deleteScenario = async ({ scenarioId }: any) => {
  const docRef = doc(db, 'scenarios', scenarioId);
  await deleteDoc(docRef);
};

export const cloneScenario = async ({ scenarioToClone, newName }: any) => {
  const scenarioId = uuidv4();
  const originalDocRef = doc(db, 'scenarios', scenarioId);
  const newDocRef = doc(db, 'scenarios', newName);

  const newDocSnap = await getDoc(newDocRef);
  if (newDocSnap.exists()) {
    throw new Error('A scenario with that name already exists.');
  }

  const originalDocSnap = await getDoc(originalDocRef);
  if (!originalDocSnap.exists()) {
    throw new Error('The scenario to clone does not exist.');
  }

  const originalData = originalDocSnap.data();
  const newData = {
    ...originalData,
    name: newName,
    job: scenarioToClone.job, 
    description: originalData.description || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastUsedAt: null
  };

  await setDoc(newDocRef, newData);
  return { id: newName, ...newData, createdAt: new Date(), updatedAt: new Date(), lastUsedAt: null };
};


export const fetchScenarioData = async ({ scenarioId }: any) => {
  if (!scenarioId) return { nodes: [], edges: [], startNodeId: null, description: '' };
  const scenarioDocRef = doc(db, "scenarios", scenarioId);
  const docSnap = await getDoc(scenarioDocRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return { ...data, startNodeId: data.startNodeId || null, description: data.description || '', lastUsedAt: data.lastUsedAt || null };
  }
  console.log(`No such document for scenario: ${scenarioId}!`);
  return { nodes: [], edges: [], startNodeId: null, description: '' };
};

export const saveScenarioData = async ({ scenario, data }: any) => {
  if (!scenario || !scenario.id) {
    throw new Error('No scenario selected to save.');
  }

  const scenarioDocRef = doc(db, "scenarios", scenario.id);
  const saveData = {
    ...data,
    name: scenario.name,
    job: scenario.job ?? 'Process',
    description: scenario.description || '',
    updatedAt: serverTimestamp()
  };

  // Commit only updates the current working copy.
  if (!scenario.version_yn) {
    await setDoc(scenarioDocRef, saveData, { merge: true });
    return { id: scenario.id, version_yn: false };
  }

  // Push atomically increments the version and stores an immutable snapshot.
  return runTransaction(db, async (transaction) => {
    const scenarioSnapshot = await transaction.get(scenarioDocRef);
    if (!scenarioSnapshot.exists()) {
      throw new Error('Scenario not found.');
    }

    const storedScenario = scenarioSnapshot.data();
    const storedVersion = Number(
      storedScenario.ltst_ver_id ?? storedScenario.latestVersion ?? 0,
    );
    const latestVersion = Number.isFinite(storedVersion) ? storedVersion : 0;
    const nextVersion = latestVersion + 1;
    const versionDocRef = doc(
      db,
      'scenarios',
      scenario.id,
      'versions',
      String(nextVersion),
    );

    transaction.set(versionDocRef, {
      snro_id: scenario.id,
      ver_id: nextVersion,
      version: nextVersion,
      depn_yn: false,
      name: scenario.name,
      job: scenario.job ?? 'Process',
      description: scenario.description || '',
      nodes: data.nodes ?? [],
      edges: data.edges ?? [],
      startNodeId: data.startNodeId ?? null,
      createdAt: serverTimestamp(),
    });

    transaction.set(
      scenarioDocRef,
      {
        ...saveData,
        latestVersion: nextVersion,
        ltst_ver_id: nextVersion,
        version_yn: false,
      },
      { merge: true },
    );

    return {
      id: scenario.id,
      latestVersion: nextVersion,
      ltst_ver_id: nextVersion,
      version_yn: false,
    };
  });
};

export const getScenarioVersions = async ({ scenario_id }: any) => {
  if (!scenario_id) return { version_list: [] };

  const versionsRef = collection(db, 'scenarios', scenario_id, 'versions');
  const versionsQuery = query(versionsRef, orderBy('ver_id', 'desc'));
  const snapshot = await getDocs(versionsQuery);

  return {
    version_list: snapshot.docs.map((versionDoc) => ({
      id: versionDoc.id,
      ...versionDoc.data(),
    })),
  };
};

export const getScenarioVersion = async ({
  scenario_id,
  version_id,
}: any) => {
  if (!scenario_id) {
    throw new Error('Scenario ID is required.');
  }

  const targetRef = version_id
    ? doc(db, 'scenarios', scenario_id, 'versions', String(version_id))
    : doc(db, 'scenarios', scenario_id);
  const snapshot = await getDoc(targetRef);

  if (!snapshot.exists()) {
    throw new Error(`Scenario version '${version_id}' not found.`);
  }

  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    nodes: data.nodes ?? [],
    edges: data.edges ?? [],
    startNodeId: data.startNodeId ?? data.start_node_id ?? null,
    start_node_id: data.start_node_id ?? data.startNodeId ?? null,
  };
};

export const getScenarioDeployHistory = async ({
  scenario_id,
  page = 1,
  pageSize = 50,
}: any) => {
  if (!scenario_id) return [];

  const historyRef = collection(
    db,
    'scenarios',
    scenario_id,
    'deployHistory',
  );
  const historyQuery = query(historyRef, orderBy('depn_dt', 'desc'));
  const snapshot = await getDocs(historyQuery);
  const start = Math.max(0, (Number(page) - 1) * Number(pageSize));
  const end = start + Number(pageSize);

  const items = snapshot.docs.slice(start, end).map((historyDoc) => {
    const data = historyDoc.data();
    const deployedAt = data.depn_dt?.toDate?.() ?? data.depn_dt ?? null;

    return {
      id: historyDoc.id,
      ...data,
      depn_dt:
        deployedAt instanceof Date ? deployedAt.toISOString() : deployedAt,
    };
  });

  return { items, totalCount: snapshot.size };
};

export const restoreScenarioVersion = async ({
  scenario_id,
  version_id,
}: any) => {
  if (!scenario_id || version_id === undefined || version_id === null) {
    throw new Error('Scenario ID and version ID are required.');
  }

  const scenarioRef = doc(db, 'scenarios', scenario_id);
  const versionRef = doc(
    db,
    'scenarios',
    scenario_id,
    'versions',
    String(version_id),
  );

  return runTransaction(db, async (transaction) => {
    const versionSnapshot = await transaction.get(versionRef);
    if (!versionSnapshot.exists()) {
      throw new Error(`Scenario version '${version_id}' not found.`);
    }

    const versionData = versionSnapshot.data();
    const restoredData = {
      name: versionData.name ?? '',
      job: versionData.job ?? 'Process',
      description: versionData.description ?? '',
      nodes: versionData.nodes ?? [],
      edges: versionData.edges ?? [],
      startNodeId:
        versionData.startNodeId ?? versionData.start_node_id ?? null,
      restoredFromVersion: version_id,
      updatedAt: serverTimestamp(),
    };

    transaction.set(scenarioRef, restoredData, { merge: true });

    return {
      id: scenario_id,
      ...restoredData,
      updatedAt: new Date(),
    };
  });
};

export const scenarioVersionDeploy = async ({
  snro_id,
  scenario_id,
  ver_id,
  memo = '',
  depn_usr_id = '',
}: any) => {
  const scenarioId = snro_id ?? scenario_id;
  if (!scenarioId || ver_id === undefined || ver_id === null) {
    throw new Error('Scenario ID and version ID are required.');
  }

  const scenarioRef = doc(db, 'scenarios', scenarioId);
  const versionRef = doc(
    db,
    'scenarios',
    scenarioId,
    'versions',
    String(ver_id),
  );
  const historyRef = doc(
    collection(db, 'scenarios', scenarioId, 'deployHistory'),
  );

  return runTransaction(db, async (transaction) => {
    const scenarioSnapshot = await transaction.get(scenarioRef);
    const versionSnapshot = await transaction.get(versionRef);

    if (!scenarioSnapshot.exists()) {
      throw new Error('Scenario not found.');
    }
    if (!versionSnapshot.exists()) {
      throw new Error(`Scenario version '${ver_id}' not found.`);
    }

    const previousVersionId = scenarioSnapshot.data().depn_ver_id;
    let previousVersionRef = null;
    if (
      previousVersionId !== undefined &&
      previousVersionId !== null &&
      String(previousVersionId) !== String(ver_id)
    ) {
      previousVersionRef = doc(
        db,
        'scenarios',
        scenarioId,
        'versions',
        String(previousVersionId),
      );
      await transaction.get(previousVersionRef);
    }

    if (previousVersionRef) {
      transaction.set(previousVersionRef, { depn_yn: 'N' }, { merge: true });
    }
    transaction.set(
      versionRef,
      {
        depn_yn: 'Y',
        depn_dt: serverTimestamp(),
        depn_usr_id,
        depn_memo: memo,
      },
      { merge: true },
    );
    transaction.set(
      scenarioRef,
      {
        depn_ver_id: ver_id,
        deployedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    transaction.set(historyRef, {
      snro_id: scenarioId,
      ver_id,
      depn_dt: serverTimestamp(),
      depn_usr_id,
      depn_memo: memo,
    });

    return { id: historyRef.id, snro_id: scenarioId, ver_id };
  });
};

export const updateScenarioLastUsed = async ({ scenarioId }: any) => {
  const docRef = doc(db, 'scenarios', scenarioId);
  await updateDoc(docRef, {
    lastUsedAt: serverTimestamp()
  });
  const updatedDocSnap = await getDoc(docRef);
  if (updatedDocSnap.exists()) {
    const data = updatedDocSnap.data();
    return { id: updatedDocSnap.id, ...data };
  }
  return null;
};


// ... (API/Form 템플릿 함수들) ...
export const fetchApiTemplates = async () => {
  const templatesCollection = collection(db, 'apiTemplates');
  const querySnapshot = await getDocs(templatesCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveApiTemplate = async (templateData: any) => {
  const templatesCollection = collection(db, 'apiTemplates');
  const docRef = await addDoc(templatesCollection, templateData);
  return { id: docRef.id, ...templateData };
};

export const deleteApiTemplate = async (templateId: any) => {
  const templateDocRef = doc(db, 'apiTemplates', templateId);
  await deleteDoc(templateDocRef);
};

export const fetchFormTemplates = async () => {
  const templatesCollection = collection(db, 'formTemplates');
  const querySnapshot = await getDocs(templatesCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveFormTemplate = async (templateData: any) => {
  const templatesCollection = collection(db, 'formTemplates');
  const docRef = await addDoc(templatesCollection, templateData);
  return { id: docRef.id, ...templateData };
};

export const deleteFormTemplate = async (templateId: any) => {
  const templateDocRef = doc(db, 'formTemplates', templateId);
  await deleteDoc(templateDocRef);
};

// 💡 [추가] 노드 표시 여부 설정 저장
export const saveNodeVisibility = async (visibleNodeTypes: any) => {
  const docRef = doc(db, "settings", "nodeVisibility");
  await setDoc(docRef, { visibleNodeTypes }); // 배열을 Firestore에 저장
};

// 💡 [추가] 노드 표시 여부 설정 불러오기
export const fetchNodeVisibility = async () => {
  const docRef = doc(db, "settings", "nodeVisibility");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data(); // { visibleNodeTypes: [...] } 반환
  }
  return null; // 데이터가 없음
};
