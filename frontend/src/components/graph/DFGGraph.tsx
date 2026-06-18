import { useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Dagre from '@dagrejs/dagre'
import ActivityNode from './ActivityNode'
import type { DFGResponse } from '../../types'
import { secondsToHuman, formatNumber } from '../../lib/utils'

const nodeTypes = { activity: ActivityNode }

function getLayoutedElements(rawNodes: Node[], rawEdges: Edge[]) {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 120, marginx: 40, marginy: 40 })
  rawNodes.forEach((n) => g.setNode(n.id, { width: 180, height: 70 }))
  rawEdges.forEach((e) => g.setEdge(e.source, e.target))
  Dagre.layout(g)
  return {
    nodes: rawNodes.map((n) => ({
      ...n,
      position: { x: g.node(n.id).x - 90, y: g.node(n.id).y - 35 },
    })),
    edges: rawEdges,
  }
}

interface Props {
  data: DFGResponse
}

export default function DFGGraph({ data }: Props) {
  const maxValue = useMemo(() => Math.max(...data.nodes.map((n) => n.value), 1), [data])
  const maxEdgeValue = useMemo(() => Math.max(...data.edges.map((e) => e.value), 1), [data])

  const rawNodes: Node[] = useMemo(
    () =>
      data.nodes.map((n) => ({
        id: n.id,
        type: 'activity',
        data: {
          label: n.label,
          value: n.value,
          isStart: n.isStart,
          isEnd: n.isEnd,
          mode: data.mode,
          maxValue,
        },
        position: { x: 0, y: 0 },
      })),
    [data, maxValue],
  )

  const rawEdges: Edge[] = useMemo(
    () =>
      data.edges.map((e) => {
        const intensity = maxEdgeValue > 0 ? e.value / maxEdgeValue : 0
        const strokeWidth = 1 + intensity * 5
        const label =
          data.mode === 'frequency' ? formatNumber(e.value) : secondsToHuman(e.value)
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label,
          labelStyle: { fill: '#a5b4fc', fontSize: 10, fontWeight: 600 },
          labelBgStyle: { fill: 'transparent' },
          style: {
            strokeWidth,
            stroke: `rgba(99,102,241,${0.3 + intensity * 0.7})`,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: `rgba(99,102,241,${0.5 + intensity * 0.5})`,
          },
          animated: intensity > 0.6,
        }
      }),
    [data, maxEdgeValue],
  )

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(rawNodes, rawEdges),
    [rawNodes, rawEdges],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  useEffect(() => {
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges])

  return (
    <div className="w-full h-[560px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color="#374151" gap={20} size={1} />
        <Controls className="!bg-gray-800 !border-gray-700 !rounded-lg [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button]:!text-gray-300" />
        <MiniMap
          nodeColor="#6366f1"
          maskColor="rgba(0,0,0,0.7)"
          className="!bg-gray-800 !border-gray-700 !rounded-lg"
        />
      </ReactFlow>
    </div>
  )
}
